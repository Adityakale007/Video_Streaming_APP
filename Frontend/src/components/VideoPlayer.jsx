import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const API_BASE = "http://localhost:4000"; // your backend base URL

function VideoPlayer({ videoId }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [status, setStatus] = useState("loading"); // uploaded | merging | transcoding | ready | failed
  const [error, setError] = useState(null);

  // Poll backend for video status
  useEffect(() => {
    if (!videoId) return;

    let intervalId;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/videos/${videoId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch video status");
        }
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "failed") {
          setError(data.error || "Processing failed");
          clearInterval(intervalId);
        }

        if (data.status === "ready") {
          clearInterval(intervalId);
          // Once ready, initialize HLS playback
          setupHls(`${API_BASE}/stream/${videoId}/master.m3u8`);
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching video");
        clearInterval(intervalId);
      }
    };

    // First fetch immediately
    fetchStatus();
    // Then poll every 3 seconds until ready/failed
    intervalId = setInterval(fetchStatus, 3000);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Initialize / setup hls.js when video is ready
  const setupHls = (src) => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up any previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari / iOS native HLS support
      video.src = src;
      video.play().catch((err) => console.error("Autoplay blocked:", err));
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => console.error("Autoplay blocked:", err));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      setError("HLS not supported in this browser");
    }
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const renderStatus = () => {
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    if (status === "ready") return null;

    if (status === "uploaded" || status === "merging")
      return <p>Preparing your video… (merging chunks)</p>;

    if (status === "transcoding")
      return <p>Processing video… (transcoding to HLS)</p>;

    return <p>Loading video status…</p>;
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <video
        ref={videoRef}
        controls
        style={{ width: "100%", backgroundColor: "black" }}
        // poster="/some-thumbnail.jpg" // optional
      />
      <div style={{ marginTop: "8px", fontSize: "14px" }}>{renderStatus()}</div>
    </div>
  );
}

export default VideoPlayer;

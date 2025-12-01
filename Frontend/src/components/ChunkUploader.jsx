import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

function ChunkUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected || null);
    setProgress(0);
    setStatus("");
    setError(null);
    setVideoId(null);
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        setError("Please select a file first.");
        return;
      }

      setIsUploading(true);
      setError(null);
      setStatus("Initializing upload session...");

      // 1) INIT UPLOAD → get videoId
      const initRes = await fetch(`${API_BASE}/api/upload/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!initRes.ok) {
        throw new Error("Failed to initialize upload");
      }

      const initData = await initRes.json();
      const newVideoId = initData.videoId;
      setVideoId(newVideoId);

      // 2) Split file into chunks and upload each
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      setStatus(`Uploading ${totalChunks} chunks...`);

      for (let index = 0; index < totalChunks; index++) {
        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("chunkNumber", (index + 1).toString());
        formData.append("videoId", newVideoId);

        const chunkRes = await fetch(`${API_BASE}/api/upload/chunk`, {
          method: "POST",
          body: formData,
        });

        if (!chunkRes.ok) {
          throw new Error(`Failed to upload chunk ${index + 1}`);
        }

        const percent = Math.round(((index + 1) / totalChunks) * 100);
        setProgress(percent);
        setStatus(`Uploaded chunk ${index + 1} of ${totalChunks} (${percent}%)`);
      }

      // 3) Tell backend to merge chunks
      setStatus("Merging chunks on server...");

      const mergeRes = await fetch(`${API_BASE}/api/upload/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: newVideoId,
          totalChunks,
          fileName: file.name,
        }),
      });

      if (!mergeRes.ok) {
        throw new Error("Failed to merge chunks");
      }

      const mergeData = await mergeRes.json();
      console.log("Merge response:", mergeData);

      setStatus(
        "Upload complete. Server is transcoding the video to HLS (this may take some time)."
      );
      setIsUploading(false);

      if (onUploadComplete) {
        onUploadComplete(newVideoId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed");
      setIsUploading(false);
      setStatus("");
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto 24px",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: "12px" }}>Upload Video (Chunked)</h2>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ marginBottom: "12px" }}
      />

      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          style={{
            padding: "8px 16px",
            borderRadius: "999px",
            border: "none",
            backgroundColor: isUploading ? "#9ca3af" : "#2563eb",
            color: "white",
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
        >
          {isUploading ? "Uploading..." : "Start Upload"}
        </button>
      </div>

      {progress > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <div
            style={{
              height: "8px",
              borderRadius: "999px",
              backgroundColor: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "#22c55e",
                transition: "width 0.2s ease-out",
              }}
            />
          </div>
          <p style={{ fontSize: "12px", marginTop: "4px" }}>{progress}%</p>
        </div>
      )}

      {status && (
        <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "4px" }}>
          {status}
        </p>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "red", marginBottom: "4px" }}>
          {error}
        </p>
      )}

      {videoId && (
        <p style={{ fontSize: "13px", marginTop: "8px" }}>
          <strong>videoId:</strong> {videoId}
        </p>
      )}
    </div>
  );
}

export default ChunkUpload;

import React, { useState } from "react";
import VideoPlayer from "./components/VideoPlayer";
import ChunkUpload from "./components/ChunkUploader";

function App() {
  const [videoId, setVideoId] = useState("");

  const handleLoadDemo = () => {
    const id = window.prompt("Enter videoId:");
    if (id) setVideoId(id.trim());
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>HLS Video Player & Uploader</h1>

      {/* Chunk upload UI */}
      <ChunkUpload onUploadComplete={setVideoId} />

      <div style={{ margin: "16px 0" }}>
        <button onClick={handleLoadDemo} style={{ padding: "8px 16px" }}>
          Load Existing Video by ID
        </button>
      </div>

      {videoId && (
        <>
          <p>
            Current videoId: <b>{videoId}</b>
          </p>
          <VideoPlayer videoId={videoId} />
        </>
      )}
    </div>
  );
}

export default App;

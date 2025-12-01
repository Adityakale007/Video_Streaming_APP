// src/controllers/stream.controller.js
const fs = require("fs");
const path = require("path");

exports.streamHlsFile = (req, res) => {
  try {
    const { videoId, variant, file } = req.params;

    // Root directory where HLS files are stored
    const hlsRoot = path.join(process.cwd(), "uploads", "hls");

    let relativePath;

    if (variant && file) {
      // /stream/:videoId/:variant/:file
      // e.g. 720p/index.m3u8 or 720p/segment_000.ts
      relativePath = path.join(variant, file);
    } else {
      // /stream/:videoId/master.m3u8
      relativePath = "master.m3u8";
    }

    const fullPath = path.join(hlsRoot, videoId, relativePath);

    // SECURITY: prevent directory traversal
    if (!fullPath.startsWith(hlsRoot)) {
      return res.status(400).json({ message: "Invalid path" });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Set proper Content-Type based on extension
    const ext = path.extname(fullPath);

    if (ext === ".m3u8") {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "public, max-age=60");
    } else if (ext === ".ts") {
      res.setHeader("Content-Type", "video/mp2t");
      res.setHeader(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
    } else {
      res.setHeader("Content-Type", "application/octet-stream");
    }

    // Stream file
    const readStream = fs.createReadStream(fullPath);
    readStream.on("error", (err) => {
      console.error("Error reading HLS file:", err);
      res.status(500).end();
    });

    readStream.pipe(res);
  } catch (err) {
    console.error("HLS stream error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

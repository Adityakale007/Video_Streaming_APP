// src/controllers/upload.controller.js
const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const Video = require("../models/Video.model");
const transcodeQueue = require("../workers/queue");

// 1) INIT UPLOAD
exports.initUpload = async (req, res) => {
  try {
    const { fileName } = req.body; // optional, from frontend
    const videoId = uuidv4();

    const video = await Video.create({
      videoId,
      originalFileName: fileName || null,
      status: "uploaded",
    });

    return res.json({
      message: "Upload session created",
      videoId: video.videoId,
    });
  } catch (err) {
    console.error("initUpload error:", err);
    res.status(500).json({ message: "Failed to initialize upload" });
  }
};

// 2) UPLOAD CHUNK (same as before, just using videoId provided)
exports.uploadChunk = async (req, res) => {
  try {
    const chunk = req.files.chunk;
    const chunkNumber = req.body.chunkNumber;
    const videoId = req.body.videoId;

    const chunkDir = path.join("uploads/chunks", videoId);
    await fs.ensureDir(chunkDir);

    const chunkPath = path.join(chunkDir, `${chunkNumber}.part`);
    await chunk.mv(chunkPath);

    return res.json({ message: "Chunk uploaded" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// 3) MERGE CHUNKS + UPDATE STATUS
exports.mergeChunks = async (req, res) => {
  try {
    const { videoId, totalChunks, fileName } = req.body;

    // set status → merging
    await Video.findOneAndUpdate(
      { videoId },
      { status: "merging", originalFileName: fileName },
      { new: true }
    );

    const chunkDir = path.join("uploads/chunks", videoId);
    const finalDir = path.join("uploads/final");
    await fs.ensureDir(finalDir);

    const finalPath = path.join(finalDir, fileName);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 1; i <= totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `${i}.part`);
      const chunk = await fs.readFile(chunkPath);
      writeStream.write(chunk);
    }

    writeStream.end();

    await fs.remove(chunkDir);

    // set status → transcoding (since we now queue it)
    await Video.findOneAndUpdate(
      { videoId },
      { status: "transcoding" },
      { new: true }
    );

    // PUSH JOB TO TRANSCODE QUEUE
    await transcodeQueue.add({
      videoId,
      inputFile: finalPath,
    });

    return res.json({
      message: "File merged, transcoding started",
      filePath: finalPath,
      videoId,
    });
  } catch (err) {
    console.error("mergeChunks error:", err);

    // if something breaks, mark as failed
    if (req.body?.videoId) {
      await Video.findOneAndUpdate(
        { videoId: req.body.videoId },
        { status: "failed", error: err.message }
      );
    }

    res.status(500).json({ message: "Merge failed" });
  }
};

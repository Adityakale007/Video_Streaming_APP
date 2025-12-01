// src/models/Video.model.js
const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true, // same id used in HLS folder and upload
    },
    originalFileName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["uploaded", "merging", "transcoding", "ready", "failed"],
      default: "uploaded",
    },
    hlsPath: {
      type: String, // e.g. "uploads/hls/<videoId>/master.m3u8"
    },
    error: {
      type: String, // store last error message if failed
    },
    // you can later add: duration, size, owner, etc.
    duration: Number,     // in seconds
    thumbnail: String,    // file path
  },
  { timestamps: true } // createdAt, updatedAt
);

module.exports = mongoose.model("Video", VideoSchema);

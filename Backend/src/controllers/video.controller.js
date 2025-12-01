// src/controllers/video.controller.js
const Video = require("../models/Video.model");

exports.getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findOne({ videoId });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    return res.json(video);
  } catch (err) {
    console.error("getVideo error:", err);
    res.status(500).json({ message: "Failed to fetch video" });
  }
};

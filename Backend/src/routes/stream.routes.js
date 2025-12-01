// src/routes/stream.routes.js
const express = require("express");
const router = express.Router();
const { streamHlsFile } = require("../controllers/stream.controller");

// Route for master playlist
// /stream/:videoId/master.m3u8
router.get("/:videoId/master.m3u8", streamHlsFile);

// Route for variant playlists and segments
// /stream/:videoId/:variant/index.m3u8
// /stream/:videoId/:variant/segment_000.ts
router.get("/:videoId/:variant/:file", streamHlsFile);

module.exports = router;

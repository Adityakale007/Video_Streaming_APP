// src/routes/upload.routes.js
const express = require("express");
const router = express.Router();

const {
  initUpload,
  uploadChunk,
  mergeChunks,
} = require("../controllers/upload.controller");

router.post("/init", initUpload);
router.post("/chunk", uploadChunk);
router.post("/merge", mergeChunks);

module.exports = router;

// src/routes/video.routes.js
const express = require("express");
const router = express.Router();
const { getVideo } = require("../controllers/video.controller");

router.get("/:videoId", getVideo);

module.exports = router;

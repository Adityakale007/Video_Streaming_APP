// src/workers/transcoder.js
require("dotenv").config();

const transcodeQueue = require("./queue");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs-extra");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");   // reuse same db config
const Video = require("../models/Video.model");

ffmpeg.setFfmpegPath(ffmpegPath);

// connect to DB when worker starts
connectDB();

const extractDuration = (inputFile) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputFile, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

const extractThumbnail = (inputFile, outputDir) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .screenshots({
        timestamps: ["3"],   // capture at 3 seconds
        filename: "thumbnail.jpg",
        folder: outputDir,
      })
      .on("end", () => resolve("thumbnail.jpg"))
      .on("error", reject);
  });
};



// Define different quality variants
const VARIANTS = [
  {
    name: "360p",
    height: 360,
    bitrate: 800_000, // ~800 kbps
    bandwidth: 800_000,
    resolution: "640x360",
  },
  {
    name: "480p",
    height: 480,
    bitrate: 1_200_000, // ~1.2 Mbps
    bandwidth: 1_200_000,
    resolution: "854x480",
  },
  {
    name: "720p",
    height: 720,
    bitrate: 2_500_000, // ~2.5 Mbps
    bandwidth: 2_500_000,
    resolution: "1280x720",
  },
  {
    name: "1080p",
    height: 1080,
    bitrate: 5_000_000, // ~5 Mbps
    bandwidth: 5_000_000,
    resolution: "1920x1080",
  },
];

transcodeQueue.process(async (job, done) => {   //This line tells the queue:
                                                // Whenever a transcoding job arrives, run this function.
    const { videoId, inputFile } = job.data;

    const outputDir = path.join("uploads/hls", videoId);    //Make an output folder like: uploads/hls/abc123/
    await fs.ensureDir(outputDir);

    console.log("Starting transcoding for video:", videoId);

    try {
        // 1) Generate HLS for each variant one by one
        for (const variant of VARIANTS) {
            const variantDir = path.join(outputDir, variant.name);
            await fs.ensureDir(variantDir);
            const hlsPlaylistPath = path.join(variantDir, "index.m3u8");
            const segmentPattern = path.join(variantDir, "segment_%03d.ts");
            console.log(
                `Transcoding ${videoId} → ${variant.name} (${variant.resolution})`
            );
            await new Promise((resolve, reject) => {
                ffmpeg(inputFile)
                    // Video filters: scale height, keep aspect ratio
                    .addOptions([
                        "-vf",
                        `scale=-2:${variant.height}`, // width auto, multiple of 2
                        "-c:a",
                        "aac",
                        "-ar",
                        "48000",
                        "-c:v",
                        "libx264",
                        "-profile:v",
                        "main",                     //Ensures compatibility with mobile devices.
                        "-crf",
                        "20",
                        "-g",
                        "48",
                        "-keyint_min",
                        "48",
                        "-sc_threshold",
                        "0",
                        "-b:v",
                        `${Math.floor(variant.bitrate / 1000)}k`,
                        "-maxrate",
                        `${Math.floor(variant.bitrate * 1.07 / 1000)}k`,
                        "-bufsize",
                        `${Math.floor(variant.bitrate * 1.5 / 1000)}k`,
                        "-hls_time",
                        "5",                        //Each segment = 5 seconds
                        "-hls_playlist_type",
                        "vod",
                        "-hls_segment_filename",
                        segmentPattern,
                        "-f",
                        "hls",                      //Output format is HLS
                    ])
                    .output(hlsPlaylistPath)
                    .on("end", () => {
                        console.log(`Finished ${variant.name} for video:`, videoId);
                        resolve();
                    })
                    .on("error", (err) => {
                        console.error(`FFmpeg error on ${variant.name}:`, err.message);
                        reject(err);
                    })
                    .run();
            });
        }


        
        // 2) Create master playlist that points to all variants
        const masterPath = path.join(outputDir, "master.m3u8");
        let masterContent = "#EXTM3U\n";
        for (const variant of VARIANTS) {
            masterContent +=
                "#EXT-X-STREAM-INF:" +
                `PROGRAM-ID=1,BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution}\n` +
                `${variant.name}/index.m3u8\n`;
        }
        await fs.writeFile(masterPath, masterContent, "utf8");

        await Video.findOneAndUpdate(
        { videoId },
        {
            status: "ready",
            hlsPath: masterPath,
            error: null,
        }
        );

        console.log("Transcoding complete:", videoId);    //Transcoding complete message
        done();
    } catch (err) {
            console.error("Transcoding failed for video:", videoId, err);

            await Video.findOneAndUpdate(
                { videoId },
                {
                status: "failed",
                error: err.message,
                }
            );

            done(new Error(err));
            }

});
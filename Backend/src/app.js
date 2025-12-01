// Backend/src/app.js

//we removed cors package and just set headers ourselves.


const express = require("express");
const fileUpload = require("express-fileupload");

const uploadRoutes = require("./routes/upload.routes");
const streamRoutes = require("./routes/stream.routes");
const videoRoutes = require("./routes/video.routes");

const app = express();

// 🔥 Custom CORS middleware (no dependency)
app.use((req, res, next) => {
  // Allow your frontend origin
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  // What methods are allowed
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  // What headers can be sent
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Handle preflight requests quickly
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // No Content
  }

  next();
});

app.use("/thumbnails", express.static("uploads/thumbnails"));


app.use(express.json());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/stream", streamRoutes);
app.use("/api/videos", videoRoutes);

console.log("Custom CORS middleware ENABLED");

module.exports = app;

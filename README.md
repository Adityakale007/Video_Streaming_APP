# 📹 **Video Streaming Platform (Chunk Uploads, FFmpeg Transcoding, Adaptive HLS Streaming)**

*A production-grade video pipeline inspired by YouTube/Netflix*

---

## 🚀 **Overview**

This project implements a **complete end-to-end video streaming pipeline** that supports:

* **Large video uploads using chunking**
* **Merging chunks on the backend**
* **Background video transcoding using FFmpeg**
* **Adaptive bitrate streaming using HLS (.m3u8)**
* **Secure CDN-style segment delivery**
* **React-based uploader with progress tracking**
* **Status tracking: uploading → merging → transcoding → ready**

This system mirrors the fundamental architecture behind platforms like **YouTube, Vimeo, Netflix**, and demonstrates scalable video processing and streaming.

---

# 🧠 **System Architecture**

```
Frontend (React/Vite) 
    → Chunk Upload API (Express)
    → Chunk Merge
    → Transcoding Job added to Queue
        → Worker (FFmpeg) converts to HLS
            → Video segments written to /uploads/hls/:videoId
                → Served via /stream/:videoId/master.m3u8
```

---

# ✨ **Key Features**

### 🔹 **1. Chunked Video Uploads**

* Breaks large video files (GB-scale) into smaller chunks.
* Uploads chunks individually for reliability and resumability.
* Suitable for unstable networks.
* Server assembles chunks back into a final video.

---

### 🔹 **2. FFmpeg Video Transcoding (Background Worker)**

* Generates **HLS output**:

  * `master.m3u8`
  * Multiple `.ts` segments
* Prepares multiple resolutions for adaptive streaming (optional extension).
* Heavy processing done **asynchronously**, without blocking the API.

---

### 🔹 **3. Adaptive Bitrate Streaming (HLS)**

* React frontend uses **hls.js** to stream video.
* Automatically adjusts quality based on:

  * User's bandwidth
  * Device CPU
  * Real-time network fluctuations

---

### 🔹 **4. Distributed Architecture**

* **API Server** (upload, merge, stream)
* **Worker Server** (FFmpeg transcoding)
* **MongoDB** for video metadata & status
* **Redis / Bull Queue** for distributed processing
* **Frontend** for upload & playback

---

### 🔹 **5. Secure HLS Serving**

* Streams `.m3u8` playlists & `.ts` segments safely.
* Handles correct MIME types:

  * `application/vnd.apple.mpegurl`
  * `video/mp2t`
* Adds caching rules for optimized playback.

---

# 🛠️ **Tech Stack**

### **Frontend**

* React (Vite)
* hls.js (Adaptive streaming)
* Axios
* TailwindCSS (optional)
* JavaScript ES2023

### **Backend**

* Node.js
* Express.js
* express-fileupload
* FFmpeg (video transcoding)
* Bull Queue (job scheduling)
* Redis (queue backend)
* MongoDB (Atlas)
* Mongoose
* Custom CORS middleware

### **DevOps / Deployment**

* Render (Backend & Worker)
* Vercel (Frontend)
* MongoDB Atlas
* Upstash / Redis Cloud
* GitHub

---

# 📁 **Project Structure**

```
root/
├── Backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── workers/
│   │   │   └── transcoder.js
│   │   ├── models/
│   │   ├── uploads/
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChunkUploader.jsx
    │   │   ├── VideoPlayer.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    ├── index.html
    └── package.json
```

---

# ⚙️ **Backend: API Workflow**

### **1. Initialize upload**

`POST /api/upload/init`

* Creates a new video record
* Returns `videoId`

### **2. Upload chunk**

`POST /api/upload/chunk`

* Uploads one file part at a time
* Saves chunks in `/uploads/chunks/:videoId/`

### **3. Merge chunks**

`POST /api/upload/merge`

* Combines all chunks into final MP4
* Adds a transcoding job to Redis queue
* Updates status → `transcoding`

### **4. Stream HLS**

`GET /stream/:videoId/master.m3u8`

* Streams adaptive HLS video

---

# 🧪 **Frontend Features**

### ✔ Chunk-based uploader

Shows progress:
`Uploaded 43/50 chunks...`

### ✔ Auto-polling video status

Checks when processing is done.

### ✔ HLS Player

Uses hls.js to play:

```
https://backend-domain.com/stream/<videoId>/master.m3u8
```

### ✔ Supports mobile and desktop

---

# 🧪 **Run Locally**

## **1. Clone repo**

```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
```

---

# 🖥️ **Backend Setup**

```bash
cd Backend
npm install
```

Create `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/video_stream
REDIS_URL=redis://localhost:6379
PORT=4000
```

Start API:

```bash
node src/server.js
```

Start worker:

```bash
node src/workers/transcoder.js
```

---

# 🌐 **Frontend Setup**

```bash
cd Frontend
npm install
npm run dev
```

Run at:

```
http://localhost:5173
```

---

# **Set environment variables:**

```env
MONGO_URI=<atlas-uri>
REDIS_URL=<redis-url>
FRONTEND_ORIGIN=https://your-frontend.vercel.app
```

---

# 🎯 **Core Skills Demonstrated**

### 🔥 System Design

* Distributed queue-based processing
* Background workers
* Storage strategy for large files

### 🔥 Backend Engineering

* Chunked file uploads
* Merging + file streams
* Real FFmpeg workflows
* HLS streaming

### 🔥 Frontend Engineering

* Chunk slicing
* Axios uploads
* hls.js player
* Polling workflow

### 🔥 DevOps

* Multi-service hosting
* Cloud databases
* CORS & security
* Static HLS delivery

---

## - Aditya Kale

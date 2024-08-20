const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

const chunkSize = 64 * 1024; // Example: 64 KB chunks

app.use(
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    exposedHeaders: "*",
  })
);

app.get("/view-log", (req, res) => {
  let startChunk;
  let endChunk;

  const filePath = path.join(__dirname, "build.log");

  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error("File not found");
      return res.status(404).send("File not found");
    }

    const fileSize = stats.size;
    const totalChunks = Math.ceil(fileSize / chunkSize);
    const endChunkFromClient = parseInt(req.query.end_chunk, 10);

    startChunk = parseInt(req.query.start_chunk, 10);

    endChunk =
      endChunkFromClient <= totalChunks ? endChunkFromClient : totalChunks;

    // Calculate byte range
    const startByte = startChunk * chunkSize;
    const endByte = Math.min(fileSize - 1, endChunk * chunkSize - 1);
    const byteRange = endByte - startByte + 1;

    const readStream = fs.createReadStream(filePath, {
      start: startByte,
      end: endByte,
    });

    const isLastRange = endChunk === totalChunks;

    res.setHeader("Content-Range", `bytes ${startByte}-${endByte}/${fileSize}`);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", byteRange);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("X-Total-Chunks", totalChunks);
    res.setHeader("X-Data-For-Range", `${startChunk} - ${endChunk}`);
    res.setHeader("X-Is-Last-Range", isLastRange);

    readStream.pipe(res);

    readStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).send("Internal server error");
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

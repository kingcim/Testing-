const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Multer config
const upload = multer({ dest: "uploads/" });

// Root route -> show index.html directly
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("⚠️ No file uploaded!");

  const randomId = crypto.randomBytes(6).toString("hex");
  const ext = path.extname(req.file.originalname);
  const newFilename = `${randomId}${ext}`;
  const newPath = path.join("uploads", newFilename);

  fs.renameSync(req.file.path, newPath);

  const fileUrl = `${req.protocol}://${req.get("host")}/view/${newFilename}`;

  res.send(`
    <h2>✅ File uploaded successfully!</h2>
    <p>Access your file here:</p>
    <a href="${fileUrl}" target="_blank">${fileUrl}</a>
  `);
});

// Serve uploaded files
app.use("/view", express.static("uploads"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
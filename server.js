const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS (so frontend hosted anywhere can call backend)
app.use(cors());

// Multer (temp folder for uploads)
const upload = multer({ dest: "uploads/" });

// Serve hosted projects
app.use(express.static(path.join(__dirname, "sites")));

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  console.log("➡️ Upload request received");
  console.log("File:", req.file);
  console.log("Project:", req.body.project);

  if (!req.file || !req.body.project) {
    return res.status(400).send("⚠️ Please provide both a file and project name!");
  }

  // Clean project name
  const projectName = req.body.project.toLowerCase().replace(/[^a-z0-9\-]/g, "-");
  const projectDir = path.join(__dirname, "sites", projectName);

  // Create project folder if not exists
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Save file as index.html
  const ext = path.extname(req.file.originalname);
  const newPath = path.join(projectDir, `index${ext}`);

  fs.renameSync(req.file.path, newPath);

  // Build project URL
  const projectUrl = `${req.protocol}://${req.get("host")}/${projectName}`;

  res.send(`
    <h2>✅ Website hosted successfully on Codewave Web Hosting!</h2>
    <p>Your project: <b>${projectName}</b></p>
    <p>View it here:</p>
    <a href="${projectUrl}" target="_blank">${projectUrl}</a>
    <br><br>
    <small>Developed by Iconic Tech</small>
  `);
});

// Root
app.get("/", (req, res) => {
  res.send("<h1>🌐 Codewave Web Hosting</h1><p>Developed by Iconic Tech</p>");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Codewave Web Hosting running at http://localhost:${PORT}`);
});
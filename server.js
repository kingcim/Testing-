const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Multer (temporary upload folder)
const upload = multer({ dest: "uploads/" });

// Serve user websites
app.use(express.static(path.join(__dirname, "sites")));

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.body.project) {
    return res.status(400).send("⚠️ Please provide both a file and project name!");
  }

  // Clean project name (lowercase, remove spaces, safe characters)
  const projectName = req.body.project.toLowerCase().replace(/[^a-z0-9\-]/g, "-");
  const projectDir = path.join(__dirname, "sites", projectName);

  // Create project folder if it doesn’t exist
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Save uploaded file as index.html inside project folder
  const ext = path.extname(req.file.originalname);
  const newPath = path.join(projectDir, `index${ext}`);

  fs.renameSync(req.file.path, newPath);

  // Build project URL
  const projectUrl = `${req.protocol}://${req.get("host")}/${projectName}`;

  // Response page
  res.send(`
    <h2>✅ Website hosted successfully on Codewave Web Hosting!</h2>
    <p>Your project: <b>${projectName}</b></p>
    <p>View it here:</p>
    <a href="${projectUrl}" target="_blank">${projectUrl}</a>
    <br><br>
    <small>Developed by Iconic Tech</small>
  `);
});

// Root (info page)
app.get("/", (req, res) => {
  res.send(`
    <h1>🌐 Codewave Web Hosting</h1>
    <p>Developed by <b>Iconic Tech</b></p>
    <p>Use the frontend form to upload your site 🚀</p>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Codewave Web Hosting running at http://localhost:${PORT}`);
});
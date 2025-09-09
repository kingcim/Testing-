const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS (so frontend hosted anywhere can call backend)
app.use(cors());

// Serve hosted projects
app.use(express.static(path.join(__dirname, "sites")));

// Configure multer for multiple file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const projectName = req.body.project.toLowerCase().replace(/[^a-z0-9\-]/g, "-");
    const projectDir = path.join(__dirname, "sites", projectName);
    
    // Create project folder if not exists
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    cb(null, projectDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename but sanitize it
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, sanitizedName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow only certain file types
    const allowedTypes = /html|css|js|txt|json/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only HTML, CSS, JS, and text files are allowed'));
    }
  }
});

// Upload route - handle multiple files
app.post("/upload", upload.array('files', 10), (req, res) => {
  console.log("➡️ Upload request received");
  console.log("Files:", req.files);
  console.log("Project:", req.body.project);

  if (!req.files || req.files.length === 0 || !req.body.project) {
    return res.status(400).send("⚠️ Please provide both files and a project name!");
  }

  // Clean project name
  const projectName = req.body.project.toLowerCase().replace(/[^a-z0-9\-]/g, "-");
  
  // Build project URL
  const projectUrl = `${req.protocol}://${req.get("host")}/${projectName}`;

  res.send(`
    <h2>✅ Website hosted successfully on Codewave Web Hosting!</h2>
    <p>Your project: <b>${projectName}</b></p>
    <p>Files uploaded: <b>${req.files.length}</b></p>
    <p>View it here:</p>
    <a href="${projectUrl}" target="_blank">${projectUrl}</a>
    <br><br>
    <small>Developed by Iconic Tech</small>
  `);
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).send('Too many files uploaded. Maximum is 10.');
    }
  }
  
  res.status(500).send(error.message);
});

// Root
app.get("/", (req, res) => {
  res.send("<h1>🌐 Codewave Web Hosting</h1><p>Developed by Iconic Tech</p>");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Codewave Web Hosting running at http://localhost:${PORT}`);
});
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS (so frontend hosted anywhere can call backend)
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve hosted projects
app.use(express.static(path.join(__dirname, "sites")));

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

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
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: function (req, file, cb) {
    // Allow only certain file types
    const allowedTypes = /html|css|js|txt|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only web files (HTML, CSS, JS, images, fonts) are allowed'));
    }
  }
});

// API route to get user's projects
app.get("/api/projects", (req, res) => {
  try {
    const dbPath = path.join(dbDir, "projects.json");
    let projects = [];
    
    if (fs.existsSync(dbPath)) {
      projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to read projects" });
  }
});

// API route to save project info
app.post("/api/projects", (req, res) => {
  try {
    const { name, url, date, files } = req.body;
    const dbPath = path.join(dbDir, "projects.json");
    let projects = [];
    
    if (fs.existsSync(dbPath)) {
      projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
    
    // Check if project already exists
    const existingIndex = projects.findIndex(p => p.name === name);
    if (existingIndex >= 0) {
      projects[existingIndex] = { name, url, date, files };
    } else {
      projects.push({ name, url, date, files });
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2));
    res.json({ success: true, message: "Project saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save project" });
  }
});

// API route to delete a project
app.delete("/api/projects/:name", (req, res) => {
  try {
    const projectName = req.params.name;
    const dbPath = path.join(dbDir, "projects.json");
    
    if (fs.existsSync(dbPath)) {
      let projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      projects = projects.filter(p => p.name !== projectName);
      fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2));
    }
    
    // Also delete the project files
    const projectDir = path.join(__dirname, "sites", projectName);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
    
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Upload route - handle multiple files
app.post("/upload", upload.array('files', 20), (req, res) => {
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
  
  // Save project info to database
  try {
    const dbPath = path.join(dbDir, "projects.json");
    let projects = [];
    
    if (fs.existsSync(dbPath)) {
      projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
    
    // Check if project already exists
    const existingIndex = projects.findIndex(p => p.name === projectName);
    const fileList = req.files.map(file => ({
      name: file.originalname,
      size: file.size,
      uploaded: new Date().toISOString()
    }));
    
    const projectData = {
      name: projectName,
      url: projectUrl,
      date: new Date().toISOString(),
      files: fileList
    };
    
    if (existingIndex >= 0) {
      projects[existingIndex] = projectData;
    } else {
      projects.push(projectData);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error("Error saving project info:", error);
  }

  res.send(`
    <div style="font-family: 'Poppins', sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="color: #4CAF50; margin-bottom: 15px;">✅ Website Hosted Successfully!</h2>
      <p style="margin-bottom: 10px;">Your project: <b style="color: #6366f1;">${projectName}</b></p>
      <p style="margin-bottom: 10px;">Files uploaded: <b>${req.files.length}</b></p>
      <p style="margin-bottom: 15px;">View it here:</p>
      <a href="${projectUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Open Website
      </a>
      <br><br>
      <small style="color: #64748b;">Developed by Iconic Tech • Protected by SilentByte Security System</small>
    </div>
  `);
});

// API endpoint to get file list for editing
app.get("/api/project/:name/files", (req, res) => {
  try {
    const projectName = req.params.name;
    const projectDir = path.join(__dirname, "sites", projectName);
    
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const files = fs.readdirSync(projectDir);
    const fileDetails = files.map(file => {
      const filePath = path.join(projectDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime
      };
    });
    
    res.json(fileDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to read project files" });
  }
});

// API endpoint to get file content for editing
app.get("/api/project/:name/file/:filename", (req, res) => {
  try {
    const projectName = req.params.name;
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "sites", projectName, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const content = fs.readFileSync(filePath, "utf8");
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: "Failed to read file" });
  }
});

// API endpoint to update file content
app.put("/api/project/:name/file/:filename", (req, res) => {
  try {
    const projectName = req.params.name;
    const filename = req.params.filename;
    const { content } = req.body;
    const filePath = path.join(__dirname, "sites", projectName, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    fs.writeFileSync(filePath, content, "utf8");
    res.json({ success: true, message: "File updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update file" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).send('Too many files uploaded. Maximum is 20.');
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send('File too large. Maximum size is 10MB.');
    }
  }
  
  res.status(500).send(error.message);
});

// Root
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🌐 Codewave Web Hosting</title>
      <style>
        body { 
          font-family: 'Poppins', sans-serif; 
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          padding: 30px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 { margin-bottom: 10px; }
        p { margin-bottom: 20px; opacity: 0.9; }
        a { 
          color: white; 
          text-decoration: none;
          font-weight: 500;
          border: 1px solid white;
          padding: 10px 20px;
          border-radius: 6px;
          display: inline-block;
          transition: all 0.3s ease;
        }
        a:hover {
          background: white;
          color: #6366f1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌐 Codewave Web Hosting</h1>
        <p>Free hosting for your web projects</p>
        <p>Developed by Iconic Tech • Protected by SilentByte Security System</p>
        <a href="/upload.html">Go to Upload Interface</a>
      </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Codewave Web Hosting running at http://localhost:${PORT}`);
  console.log(`📁 Serving sites from: ${path.join(__dirname, "sites")}`);
  console.log(`💾 Database location: ${path.join(__dirname, "database")}`);
  console.log(`🔒 Protected by SilentByte Security System`);
  console.log(`👨‍💻 Developed by Iconic Tech`);
});
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve all root files as static
app.use(express.static(__dirname));

// Environment variables
const TEMPLATE_OWNER = "iconic05";
const TEMPLATE_REPO = "Space-XMD";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Check if user forked the repo
app.post("/checkFork", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${TEMPLATE_REPO}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "SpaceXMD-Host" }
    });

    if (response.status === 200) {
      return res.json({ forked: true, repo: `https://github.com/${username}/${TEMPLATE_REPO}` });
    }
    return res.json({ forked: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fork repo
app.post("/fork", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const forkResp = await fetch(`https://api.github.com/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/forks`, {
      method: "POST",
      headers: { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "SpaceXMD-Host" }
    });
    const forkData = await forkResp.json();

    if (forkResp.status !== 202 && forkResp.status !== 201) {
      return res.status(400).json({ error: forkData.message });
    }

    res.json({ success: true, repo: `https://github.com/${username}/${TEMPLATE_REPO}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
// server.js
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// === Verify reCAPTCHA endpoint ===
app.post("/verify-recaptcha", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: "Missing token" });

  try {
    const secretKey = process.env.RECAPTCHA_SECRET;
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();

    if (data.success) {
      res.json({ success: true, message: "✅ reCAPTCHA verified" });
    } else {
      res.json({ success: false, error: "❌ reCAPTCHA failed", details: data["error-codes"] });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error", details: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 reCAPTCHA backend running on port ${PORT}`));
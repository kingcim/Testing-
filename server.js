// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch"; // or use global fetch in Node 18+

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "6LeZdMErAAAAAD5JmneuXGSOBCYroeCO96AwtLyq"; // your secret

app.post("/verify-recaptcha", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: "Token missing" });

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${token}`,
      { method: "POST" }
    );
    const data = await response.json();
    return res.json({ success: data.success });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
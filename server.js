const express = require('express');
const fetch = require('node-fetch'); // npm i node-fetch@2
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Your reCAPTCHA secret key
const RECAPTCHA_SECRET = '6Le1ecErAAAAAAHnOx0AakSz2Gn7c_J-cWySnrYb';

app.use(cors());
app.use(bodyParser.json());

// Endpoint to verify reCAPTCHA token
app.post('/verify-recaptcha', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
    }

    try {
        const response = await fetch(
            `https://www.google.com/recaptcha/api/siteverify`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${RECAPTCHA_SECRET}&response=${token}`
            }
        );
        const data = await response.json();

        if (data.success) {
            return res.json({ success: true, message: 'reCAPTCHA verified successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed', errors: data['error-codes'] });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`reCAPTCHA server running on port ${PORT}`);
});
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/signup
router.post('/signup', async(req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }

    try {
        // Check if user exists
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword]
        );

        const userId = result.insertId;

        res.status(201).json({
            message: "User created successfully",
            token: generateToken(userId),
            user: { id: userId, username, email }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/auth/login
router.post('/login', async(req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users[0];

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            message: "Login successful",
            token: generateToken(user.id),
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
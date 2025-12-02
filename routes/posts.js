const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/auth'); // This line is the problem in Node 22

// POST /api/posts - Create post
router.post('/', protect, async(req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)", [userId, title, content]
        );

        res.status(201).json({ id: result.insertId, title, content, user_id: userId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/posts - Get all posts
router.get('/', async(req, res) => {
    try {
        const [posts] = await db.query(`
      SELECT p.*, u.username 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async(req, res) => {
    try {
        const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);
        if (posts.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.json(posts[0]);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/posts/:id - Update post (only owner)
router.put('/:id', protect, async(req, res) => {
    const { title, content } = req.body;

    try {
        const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);
        if (posts.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (posts[0].user_id !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this post" });
        }

        await db.query("UPDATE posts SET title = ?, content = ? WHERE id = ?", [title, content, req.params.id]);
        res.json({ message: "Post updated" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /api/posts/:id - Delete post (only owner)
router.delete('/:id', protect, async(req, res) => {
    try {
        const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);
        if (posts.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (posts[0].user_id !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }

        await db.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
        res.json({ message: "Post deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
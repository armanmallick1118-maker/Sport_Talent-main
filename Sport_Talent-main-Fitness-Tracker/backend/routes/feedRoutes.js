const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getFeed, createFeedPost } = require('../controllers/feedController');

// GET /api/v1/feed - Fetch feed posts (Public)
router.get('/', getFeed);

// POST /api/v1/feed - Create a new feed post
router.post('/', verifyToken, createFeedPost);

module.exports = router;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get the latest feed posts
// @route   GET /api/v1/feed
// @access  Public or Protected
const getFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;

    const posts = await prisma.feedPost.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error('Error fetching feed, Sensei:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error fetching feed',
    });
  }
};

// @desc    Create a new feed post
// @route   POST /api/v1/feed
// @access  Protected
const createFeedPost = async (req, res) => {
  try {
    const { type, title, content, mediaUrl, external_url } = req.body;
    // authorId comes from the verified JWT token — never trust the client
    const authorId = req.user?.id || req.user?.userId || 'anonymous';

    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide type, title, and content',
      });
    }

    const newPost = await prisma.feedPost.create({
      data: {
        type,
        title,
        content,
        authorId,
        mediaUrl: mediaUrl || null,
        external_url: external_url || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: newPost,
    });
  } catch (error) {
    console.error('Error creating feed post, Sensei:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error creating feed post',
    });
  }
};

// @desc    Get a single feed post by ID
// @route   GET /api/v1/feed/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.feedPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getFeed,
  createFeedPost,
  getPostById,
};

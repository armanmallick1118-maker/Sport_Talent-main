const express = require('express');
const router = express.Router();

// Example endpoint for your team members
router.get('/hello', async (req, res) => {
    res.json({ message: "Hello from your new team feature!" });
});

module.exports = router;

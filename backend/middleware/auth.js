const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_sensei';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided, access denied, Sensei!' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken; // Secures the route with the real user's ID from PostgreSQL, Sensei!
    next();
  } catch (error) {
    console.error("Auth Error, Sensei:", error);
    return res.status(401).json({ error: 'Invalid or expired token, Sensei!' });
  }
};

module.exports = verifyToken;
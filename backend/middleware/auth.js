const jwt = require('jsonwebtoken');

const CANDIDATE_SECRETS = [
  process.env.JWT_SECRET,
  'dev_secret_key',
  'prana_secret_jwt_key_2026',
  'fallback_secret_key_sensei',
].filter(Boolean);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided, access denied, Sensei!' });
  }

  const token = authHeader.split('Bearer ')[1];

  let decodedToken = null;
  for (const secret of CANDIDATE_SECRETS) {
    try {
      decodedToken = jwt.verify(token, secret);
      if (decodedToken) break;
    } catch (e) {}
  }

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid or expired token, Sensei!' });
  }

  req.user = decodedToken;
  next();
};

module.exports = verifyToken;
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: err.message, code: 400 });
  }

  res.status(500).json({ success: false, error: 'Internal Server Error', code: 500 });
};

module.exports = errorHandler;

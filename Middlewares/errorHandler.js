const errorHandler = (err, req, res, next) => {
  // Handle Cloudinary-specific errors
  if (err.message && err.message.includes('Cloudinary')) {
    console.error('Cloudinary Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Image upload failed. Please try again.',
      error: err.message
    });
  }

  // Handle file size limit errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File is too large. Maximum size is 5MB.'
    });
  }

  // Handle file type errors
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(415).json({
      success: false,
      message: 'Invalid file type. Only images are allowed.'
    });
  }

  console.error(err.stack);

  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      error: err.message
    });
  }

  // Handle authentication errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err.message
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.message
    });
  }

  // Handle other errors
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
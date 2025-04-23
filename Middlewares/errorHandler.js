const errorHandler = (err, req, res, next) => {
  console.error('Error caught by middleware:', err);

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File is too large',
      error: err.message
    });
  }

  if (err.message === 'Unexpected end of form') {
    return res.status(400).json({
      success: false,
      message: 'File upload was interrupted',
      error: err.message
    });
  }

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
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
};

module.exports = errorHandler;
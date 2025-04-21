const { cloudinary, uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    const error = new Error('File too large. Maximum size is 5MB.');
    error.code = 'LIMIT_FILE_SIZE';
    throw error;
  }
};

const uploadImages = async (req, res, next) => {
  const uploadedImages = [];
  try {
    if (!req.files) return next();

    // Handle logo image
    if (req.files.logoImage) {
      validateImageFile(req.files.logoImage);
      const logoResult = await uploadToCloudinary(req.files.logoImage, { 
        type: 'logo',
        folder: `${process.env.CLOUDINARY_FOLDER || 'restaurants'}/${req.body.email || 'temp'}`
      });
      uploadedImages.push({ type: 'logo', ...logoResult });
      req.logoUrl = logoResult;
    }

    // Handle map image
    if (req.files.mapImage) {
      validateImageFile(req.files.mapImage);
      const mapResult = await uploadToCloudinary(req.files.mapImage, { 
        type: 'map',
        folder: `${process.env.CLOUDINARY_FOLDER || 'restaurants'}/${req.body.email || 'temp'}`
      });
      uploadedImages.push({ type: 'map', ...mapResult });
      req.mapUrl = mapResult;
    }

    next();
  } catch (error) {
    // Cleanup any uploaded images if there's an error
    await Promise.all(uploadedImages.map(img => deleteFromCloudinary(img.default)));
    
    // Format error message for client
    const errorMessage = error.message.includes('Cloudinary') 
      ? 'Image upload failed. Please try again.'
      : error.message;
    
    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      success: false,
      message: errorMessage
    });
  }
};

module.exports = {
  uploadImages,
  validateImageFile
};
const { cloudinary, uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Invalid file type');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    const error = new Error('File too large');
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
        folder: `${process.env.CLOUDINARY_FOLDER}/${req.restaurant?.email || 'temp'}`
      });
      uploadedImages.push({ type: 'logo', url: logoResult.default });
      req.logoUrl = logoResult;
    }

    // Handle map image
    if (req.files.mapImage) {
      validateImageFile(req.files.mapImage);
      const mapResult = await uploadToCloudinary(req.files.mapImage, { 
        type: 'map',
        folder: `${process.env.CLOUDINARY_FOLDER}/${req.restaurant?.email || 'temp'}`
      });
      uploadedImages.push({ type: 'map', url: mapResult.default });
      req.mapUrl = mapResult;
    }

    next();
  } catch (error) {
    // Cleanup any uploaded images if there's an error
    await Promise.all(uploadedImages.map(img => deleteFromCloudinary(img.url)));
    next(error);
  }
};

module.exports = {
  uploadImages,
  validateImageFile
};
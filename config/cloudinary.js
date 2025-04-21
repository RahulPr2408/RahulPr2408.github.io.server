const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Breakpoint configurations for responsive images
const breakpoints = {
  mobile: { width: 320, height: 240 },
  tablet: { width: 768, height: 576 },
  desktop: { width: 1024, height: 768 }
};

// Utility function to upload file to Cloudinary with optimizations
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const folder = options.folder || `${process.env.CLOUDINARY_FOLDER || 'restaurants'}/${options.type || 'general'}`;
    
    // Default transformation options
    const defaultTransformation = {
      quality: 'auto',
      format: 'auto',
      responsive: true,
      responsive_breakpoints: {
        create_derived: true,
        bytes_step: 20000,
        min_width: 200,
        max_width: 1024
      }
    };

    // Specific transformations based on image type
    const typeSpecificTransformations = {
      logo: {
        mobile: { width: breakpoints.mobile.width, height: breakpoints.mobile.height, crop: 'fit' },
        tablet: { width: breakpoints.tablet.width, height: breakpoints.tablet.height, crop: 'fit' },
        desktop: { width: breakpoints.desktop.width, height: breakpoints.desktop.height, crop: 'fit' }
      },
      map: {
        mobile: { width: breakpoints.mobile.width, height: breakpoints.mobile.height, crop: 'fill' },
        tablet: { width: breakpoints.tablet.width, height: breakpoints.tablet.height, crop: 'fill' },
        desktop: { width: breakpoints.desktop.width, height: breakpoints.desktop.height, crop: 'fill' }
      }
    };

    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      resource_type: 'auto',
      format: 'auto',
      transformation: [{
        quality: 'auto',
        fetch_format: 'auto'
      }],
      eager: options.type ? Object.values(typeSpecificTransformations[options.type]) : undefined,
      eager_async: true
    });

    // Return URLs for different breakpoints if available
    return {
      default: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      responsive: uploadResult.eager ? 
        uploadResult.eager.reduce((acc, img, index) => {
          const size = Object.keys(breakpoints)[index];
          acc[size] = img.secure_url;
          return acc;
        }, {}) : 
        null
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Function to delete image from Cloudinary
const deleteFromCloudinary = async (publicUrl) => {
  try {
    if (!publicUrl) return;
    
    // Extract public ID from the URL
    const publicId = publicUrl.split('/upload/')[1].split('.')[0];
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error since this is cleanup
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
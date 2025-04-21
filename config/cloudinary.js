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
      fetch_format: 'auto',
      responsive: true,
      responsive_breakpoints: {
        create_derived: true,
        bytes_step: 20000,
        min_width: 200,
        max_width: 1024,
        transformation: { crop: 'fill', aspect_ratio: '16:9', quality: 'auto' }
      }
    };

    // Specific transformations based on image type
    const typeSpecificTransformations = {
      logo: {
        mobile: { ...breakpoints.mobile, crop: 'fit' },
        tablet: { ...breakpoints.tablet, crop: 'fit' },
        desktop: { ...breakpoints.desktop, crop: 'fit' },
        format: 'webp'
      },
      map: {
        mobile: { ...breakpoints.mobile, crop: 'fill' },
        tablet: { ...breakpoints.tablet, crop: 'fill' },
        desktop: { ...breakpoints.desktop, crop: 'fill' },
        format: 'webp'
      }
    };

    const transformation = options.type ? 
      [defaultTransformation, ...Object.values(typeSpecificTransformations[options.type])] :
      [defaultTransformation];

    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      transformation,
      resource_type: 'auto',
      responsive: true,
      eager: options.type ? Object.values(typeSpecificTransformations[options.type]) : undefined,
      eager_async: true
    });

    // Return URLs for different breakpoints if available
    return {
      default: uploadResult.secure_url,
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

// Function to generate responsive image URLs
const getResponsiveImageUrl = (publicUrl, options = {}) => {
  if (!publicUrl) return null;

  const transformations = [];
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);

  if (transformations.length === 0) return publicUrl;

  const transformationString = transformations.join(',');
  const parts = publicUrl.split('/upload/');
  return `${parts[0]}/upload/${transformationString}/${parts[1]}`;
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
  deleteFromCloudinary,
  getResponsiveImageUrl
};
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Breakpoint configurations for responsive images
const breakpoints = {
  mobile: { width: 320, height: 240 },
  tablet: { width: 768, height: 576 },
  desktop: { width: 1024, height: 768 }
};

// Utility function to upload file to Cloudinary with optimizations
const uploadToCloudinary = async (file, folder) => {
  const options = {
    folder,
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  };

  const result = await cloudinary.uploader.upload(file.path, options);
  return result.secure_url;
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
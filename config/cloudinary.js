const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility function to upload file to Cloudinary with optimizations and error handling
const uploadToCloudinary = async (filePath, folder) => {
  try {
    console.log('Uploading to Cloudinary:', { filePath, folder });
    
    // Set options for better performance and reliability
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      timeout: 60000, // 60 second timeout
      // Image optimization options
      quality: 'auto', // Auto optimize quality
      fetch_format: 'auto', // Auto format
      flags: 'lossy', // Apply lossy compression
      // Set reasonable size limits
      transformation: [
        { width: 1000, crop: 'limit' }
      ]
    });
    
    console.log('Cloudinary upload successful:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Check for specific error types and provide better error messages
    if (error.http_code === 400) {
      throw new Error('Invalid image file format. Please try a different image.');
    } else if (error.http_code === 401) {
      throw new Error('Authentication with image service failed. Please contact support.');
    } else if (error.http_code === 404) {
      throw new Error('Image resource not found. File may be corrupted.');
    } else if (error.http_code >= 500) {
      throw new Error('Image service is currently experiencing issues. Please try again later.');
    } else {
      throw new Error('Failed to upload image: ' + (error.message || 'Unknown error'));
    }
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
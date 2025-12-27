import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

const uploadOnCloudinary = async (filePath) => {
  // ✅ Configure Cloudinary
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

  try {
    // ✅ Check if credentials are configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary credentials not configured');
      
      // Clean up file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw new Error('Cloudinary credentials not configured');
    }

    if (!filePath) {
      console.error('❌ No file path provided');
      return null;
    }

    // ✅ Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File does not exist:', filePath);
      return null;
    }

    console.log('☁️ Uploading to Cloudinary:', filePath);

    // ✅ Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Auto-detect file type
      folder: 'global-connect', // Organize uploads
    });

    // ✅ Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.log('✅ Cloudinary upload success:', uploadResult.secure_url);
    return uploadResult.secure_url;

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);

    // ✅ Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('🧹 Cleaned up local file');
      } catch (cleanupError) {
        console.error('❌ File cleanup error:', cleanupError);
      }
    }

    // ✅ Return null instead of throwing
    return null;
  }
};

export default uploadOnCloudinary;
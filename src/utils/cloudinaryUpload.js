// src/utils/cloudinaryUpload.js
import axios from 'axios';

// ✅ Pour Create React App - préfixe REACT_APP_
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
 
console.log('CLOUD_NAME:', CLOUD_NAME);
console.log('UPLOAD_PRESET:', UPLOAD_PRESET);
export const uploadToCloudinary = async (file) => {
  // Debug pour vérifier les variables
  // console.log('🔍 Config Cloudinary:', {
  //   cloudName: CLOUD_NAME,
  //   uploadPreset: UPLOAD_PRESET,
  //   hasCloudName: !!CLOUD_NAME,
  //   hasUploadPreset: !!UPLOAD_PRESET
  // });

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    // console.error('❌ Variables env manquantes:', {
    //   REACT_APP_CLOUDINARY_CLOUD_NAME: CLOUD_NAME,
    //   REACT_APP_CLOUDINARY_UPLOAD_PRESET: UPLOAD_PRESET
    // });
    throw new Error('Configuration Cloudinary manquante. Vérifiez votre fichier .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'an-nour');
  formData.append('tags', 'payment_receipt');

  try {
    // console.log('📤 Upload vers Cloudinary en cours...');
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // onUploadProgress: (progressEvent) => {
        //   const percentCompleted = Math.round(
        //     (progressEvent.loaded * 100) / progressEvent.total
        //   );
          // console.log('📊 Upload progress:', percentCompleted + '%');
        // }
      }
    );

    // console.log('✅ Upload réussi:', response.data.secure_url);

    return {
      success: true,
      url: response.data.secure_url,
      publicId: response.data.public_id,
      assetId: response.data.asset_id,
      format: response.data.format,
      size: response.data.bytes
    };

  } catch (error) {
    // console.error('❌ Erreur upload Cloudinary:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

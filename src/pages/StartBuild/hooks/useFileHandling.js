import { validateFiles } from '../../../utils/fileValidation';

export const useFileHandling = (builds, setBuilds) => {

  // Helper: normalize frontend testType to backend-friendly photo_type
  const normalizePhotoType = (type) => {
    const map = {
      visualInspection: 'visual_inspection',
      dimmsDetected: 'dimms_detected',
      boot: 'boot',
      lomWorking: 'lom_working',
      // Add more mappings as needed
    };
    return map[type] || type;
  };
    // Handle file selection (store locally, don't upload yet)
    const handleFileSelection = (buildIndex, testType, files) => {
      const updatedBuilds = [...builds];

      // Validate files first
      const validation = validateFiles(files, 'IMAGE');
      
      if (!validation.isValid) {
        // Set error on the build
        const photoKey = `${testType}Photos`;
        updatedBuilds[buildIndex].errors[photoKey] = validation.errors.join(', ');
        setBuilds(updatedBuilds);
        return;
      }

      const normalizedType = normalizePhotoType(testType);
      
      // Store file objects directly
      const newPhotos = Array.from(files).map(file => ({
        file: file,
        name: file.name,
        type: normalizedType
      }));
  
      // Ensure the photos array exists
      const photoKey = `${testType}Photos`;
      if (!updatedBuilds[buildIndex].systemInfo[photoKey]) {
        updatedBuilds[buildIndex].systemInfo[photoKey] = [];
      }
  
      // Add new photos
    updatedBuilds[buildIndex].systemInfo[photoKey] = [
      ...updatedBuilds[buildIndex].systemInfo[photoKey],
      ...newPhotos
    ];
  
      // Clear photo error if photos were added
    if (newPhotos.length > 0 && updatedBuilds[buildIndex].errors[photoKey]) {
      delete updatedBuilds[buildIndex].errors[photoKey];
    }

    setBuilds(updatedBuilds);
  };
  
    // Remove photo
  const removePhoto = (buildIndex, testType, photoIndex) => {
    const updatedBuilds = [...builds];
    const photoKey = `${testType}Photos`;
    updatedBuilds[buildIndex].systemInfo[photoKey].splice(photoIndex, 1);
    setBuilds(updatedBuilds);
  };
  
    // Upload photos during save
  const uploadPhotosForBuild = async (photos) => {
    const uploadedPhotos = [];

    for (const photoData of photos) {
      try {
        const api = await import('../../../services/api');
        const { filePath } = await api.default.uploadPhoto(photoData.file, photoData.type);
        uploadedPhotos.push({
          name: photoData.name,
          path: filePath,
          type: photoData.type
        });
      } catch (error) {
        console.error('Error uploading photo:', error);
        throw new Error(`Failed to upload ${photoData.name}`);
      }
    }

    return uploadedPhotos;
  };
  
  return {
    handleFileSelection,
    removePhoto,
    uploadPhotosForBuild
  };
};
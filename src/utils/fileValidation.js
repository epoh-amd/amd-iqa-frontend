// src/utils/fileValidation.js
export const FILE_VALIDATION = {
  // Image files
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  
  // Document files
  DOCUMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/json'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.json', '.log']
  },
  
  // General files (for error logs)
  GENERAL: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/json',
      'application/zip',
      'application/x-zip-compressed'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.doc', '.docx', '.txt', '.csv', '.json', '.log',
      '.zip'
    ]
  }
};

export const validateFile = (file, validationType = 'GENERAL') => {
  const config = FILE_VALIDATION[validationType];
  const errors = [];

  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  // Check MIME type
  if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file extension as fallback
  if (config.allowedExtensions) {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`);
    }
  }

  // Check for potentially dangerous file names
  const dangerousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.com$/i,
    /\.pif$/i
  ];

  if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
    errors.push('Executable files are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeFormatted: formatFileSize(file.size)
    }
  };
};

export const validateFiles = (files, validationType = 'GENERAL') => {
  const results = Array.from(files).map(file => validateFile(file, validationType));
  const allValid = results.every(result => result.isValid);
  const allErrors = results.flatMap(result => result.errors);
  
  return {
    isValid: allValid,
    errors: allErrors,
    results
  };
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) {
    return 'image';
  }
  
  const extension = fileName.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'doc';
    case 'txt':
    case 'log':
      return 'txt';
    case 'zip':
    case 'rar':
      return 'archive';
    default:
      return 'default';
  }
};

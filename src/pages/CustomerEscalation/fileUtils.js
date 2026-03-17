// frontend/src/pages/CustomerEscalation/fileUtils.js
// File icon and management utilities

import React from 'react';
import { Image, FileText } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Render appropriate file icon based on file type
 */
export const renderFileIcon = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) {
    return <Image className="file-icon image" size={16} />;
  }
  
  const extension = fileName?.split('.').pop()?.toLowerCase() || '';
  switch (extension) {
    case 'pdf':
      return <FileText className="file-icon pdf" size={16} />;
    case 'doc':
    case 'docx':
      return <FileText className="file-icon doc" size={16} />;
    case 'txt':
    case 'log':
      return <FileText className="file-icon txt" size={16} />;
    default:
      return <FontAwesomeIcon icon={faFile} className="file-icon default" />;
  }
};
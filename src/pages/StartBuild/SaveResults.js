// frontend/src/pages/StartBuild/SaveResults.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const SaveResults = ({ saveResults }) => {
  if (saveResults.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return faCheck;
      case 'warning':
        return faExclamationTriangle;
      case 'error':
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  };

  return (
    <div className={`global-errors ${saveResults[0].type}`}>
      {saveResults.map((result, index) => (
        <div key={index}>
          <FontAwesomeIcon icon={getIcon(result.type)} />
          <span>{result.message}</span>
        </div>
      ))}
    </div>
  );
};

export default SaveResults;
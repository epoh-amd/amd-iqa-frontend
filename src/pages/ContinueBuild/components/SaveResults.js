// frontend/src/pages/ContinueBuild/components/SaveResults.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faTimesCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const SaveResults = ({ results, onClose }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="save-results">
      {results.map((result, index) => (
        <div key={index} className={`save-result ${result.type}`}>
          <div className="result-icon">
            <FontAwesomeIcon 
              icon={result.type === 'success' ? faCheckCircle : faTimesCircle} 
            />
          </div>
          <div className="result-message">{result.message}</div>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default SaveResults;
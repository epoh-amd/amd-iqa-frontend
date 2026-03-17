// frontend/src/pages/ContinueBuild/components/MessageDisplay.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

const MessageDisplay = ({ messages, onDismiss }) => {
  if (!messages || messages.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faTimesCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
      default:
        return faInfoCircle;
    }
  };

  return (
    <div className="message-display">
      {messages.map((message, index) => (
        <div key={index} className={`message-item ${message.type}`}>
          <FontAwesomeIcon icon={getIcon(message.type)} />
          <span>{message.text}</span>
          <button 
            className="dismiss-btn"
            onClick={() => onDismiss(messages.filter((_, i) => i !== index))}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default MessageDisplay;
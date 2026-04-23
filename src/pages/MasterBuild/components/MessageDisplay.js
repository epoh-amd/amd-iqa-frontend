// frontend/src/pages/MasterBuild/components/MessageDisplay.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faExclamationTriangle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const MessageDisplay = ({ messages, onDismiss }) => {
  if (!messages || messages.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return faCheck;
      case 'error':
        return faExclamationTriangle;
      case 'warning':
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  };

  const dismissMessage = (index) => {
    onDismiss(messages.filter((_, i) => i !== index));
  };

  return (
    <div className="master-messages">
      {messages.map((message, index) => (
        <div key={index} className={`message-item ${message.type}`}>
          <FontAwesomeIcon icon={getIcon(message.type)} />
          <span>{message.text}</span>
          <button 
            className="dismiss-btn"
            onClick={() => dismissMessage(index)}
            aria-label="Dismiss message"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default MessageDisplay;
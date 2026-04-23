/**
 * RobustImage Component
 * 
 * A robust image component that handles network errors gracefully
 * and provides fallback mechanisms for failed image loads
 */

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faImage, faSpinner } from '@fortawesome/free-solid-svg-icons';

const RobustImage = ({ 
  src, 
  alt, 
  fallbackSrc = null, 
  onError = null,
  className = '',
  style = {},
  maxRetries = 2,
  retryDelay = 1000,
  showLoadingSpinner = true,
  ...props 
}) => {
  const [imageState, setImageState] = useState('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    setCurrentSrc(src);
    setImageState('loading');
    setRetryCount(0);
  }, [src]);

  const handleImageLoad = () => {
    setImageState('loaded');
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  };

  const handleImageError = (e) => {
    console.warn('Image load error:', {
      src: currentSrc,
      error: e.type,
      retryCount
    });

    if (onError) {
      onError(e);
    }

    // Try fallback source if available and haven't used it yet
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageState('loading');
      return;
    }

    // Retry loading the original image
    if (retryCount < maxRetries) {
      setImageState('retrying');
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageState('loading');
        // Force reload by adding timestamp
        const separator = src.includes('?') ? '&' : '?';
        setCurrentSrc(`${src}${separator}_retry=${retryCount + 1}&_t=${Date.now()}`);
      }, retryDelay);
    } else {
      setImageState('error');
    }
  };

  const renderContent = () => {
    switch (imageState) {
      case 'loading':
        return (
          <div className="robust-image-container">
            <img
              ref={imgRef}
              src={currentSrc}
              alt={alt}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={className}
              style={{ ...style, display: 'none' }}
              {...props}
            />
            {showLoadingSpinner && (
              <div className="image-loading">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Loading...</span>
              </div>
            )}
          </div>
        );

      case 'loaded':
        return (
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={className}
            style={style}
            {...props}
          />
        );

      case 'retrying':
        return (
          <div className="robust-image-container">
            <img
              ref={imgRef}
              src={currentSrc}
              alt={alt}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={className}
              style={{ ...style, display: 'none' }}
              {...props}
            />
            <div className="image-retrying">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Retrying... ({retryCount}/{maxRetries})</span>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="image-error" style={style}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>Image not available</span>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

export default RobustImage;

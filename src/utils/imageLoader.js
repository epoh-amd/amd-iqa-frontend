/**
 * Image Loading Utilities for Production Environment
 * 
 * This module provides robust image loading functionality with fallbacks
 * and error handling for production deployments
 */

import React from 'react';
import { logger } from './logger';

/**
 * Test if an image URL is accessible
 * 
 * @param {string} imageUrl - Image URL to test
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} - Whether the image loads successfully
 */
export const testImageUrl = (imageUrl, timeout = 5000) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    const timeoutId = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };
    
    img.src = imageUrl;
  });
};

/**
 * Get fallback image URL
 * 
 * @param {string} type - Type of fallback image needed
 * @returns {string} - Fallback image URL
 */
export const getFallbackImageUrl = (type = 'default') => {
  const fallbacks = {
    photo: '/images/photo-placeholder.png',
    document: '/images/document-placeholder.png',
    error: '/images/error-placeholder.png',
    default: '/images/placeholder.png'
  };
  
  return fallbacks[type] || fallbacks.default;
};

/**
 * Smart image loader with automatic fallback
 * 
 * @param {string} primaryUrl - Primary image URL to load
 * @param {string} fallbackType - Type of fallback image
 * @returns {Promise<string>} - URL that successfully loads
 */
export const loadImageWithFallback = async (primaryUrl, fallbackType = 'default') => {
  if (!primaryUrl) {
    return getFallbackImageUrl(fallbackType);
  }
  
  const isAccessible = await testImageUrl(primaryUrl);
  
  if (isAccessible) {
    return primaryUrl;
  }
  
  logger.warn('Image failed to load, using fallback:', primaryUrl);
  return getFallbackImageUrl(fallbackType);
};

/**
 * Enhanced image component with error handling
 * 
 * @param {object} props - Image props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text
 * @param {string} props.fallbackType - Type of fallback
 * @param {function} props.onError - Custom error handler
 * @param {object} props.style - CSS styles
 * @param {string} props.className - CSS class
 * @returns {JSX.Element} - Enhanced image component
 */
export const SafeImage = ({ 
  src, 
  alt, 
  fallbackType = 'photo', 
  onError, 
  style, 
  className,
  ...otherProps 
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);
  
  const handleError = (event) => {
    if (!hasError) {
      setHasError(true);
      const fallbackUrl = getFallbackImageUrl(fallbackType);
      setImageSrc(fallbackUrl);
      
      logger.warn('Image failed to load, switching to fallback:', src);
      
      if (onError) {
        onError(event);
      }
    }
  };
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={handleError}
      style={style}
      className={className}
      {...otherProps}
    />
  );
};

/**
 * Hook for managing image loading states
 * 
 * @param {string} imageUrl - Image URL to load
 * @param {string} fallbackType - Type of fallback
 * @returns {object} - { src, isLoading, hasError, retry }
 */
export const useImageLoader = (imageUrl, fallbackType = 'default') => {
  const [src, setSrc] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  
  const loadImage = React.useCallback(async () => {
    if (!imageUrl) {
      setSrc(getFallbackImageUrl(fallbackType));
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      const finalSrc = await loadImageWithFallback(imageUrl, fallbackType);
      setSrc(finalSrc);
      setHasError(finalSrc !== imageUrl);
    } catch (error) {
      setSrc(getFallbackImageUrl(fallbackType));
      setHasError(true);
      logger.error('Image loading failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [imageUrl, fallbackType]);
  
  React.useEffect(() => {
    loadImage();
  }, [loadImage]);
  
  const retry = React.useCallback(() => {
    loadImage();
  }, [loadImage]);
  
  return { src, isLoading, hasError, retry };
};

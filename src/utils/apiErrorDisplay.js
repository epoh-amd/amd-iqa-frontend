/**
 * API Error Display Utility
 * 
 * Helper functions to display API errors using the toast notification system
 */

import { handleError } from './errorHandler';

/**
 * Display an API error using toast notifications
 * 
 * @param {Error} error - The error from an API call
 * @param {function} showToast - The toast function from useToast hook
 * @param {string} context - Context about where the error occurred
 * @param {string} endpoint - The API endpoint that failed (optional)
 */
export const displayApiError = (error, showToast, context = '', endpoint = '') => {
  const errorInfo = handleError(error, context, endpoint);
  
  // Use different toast types based on severity
  const toastType = errorInfo.severity === 'error' ? 'error' : 'warning';
  
  showToast(errorInfo.message, toastType);
  
  // In development, also show technical details
  if (process.env.NODE_ENV === 'development' && errorInfo.technical) {
    console.warn(`Technical details for ${context}:`, errorInfo.technical);
  }
};

/**
 * Handle API errors with optional custom handling
 * 
 * @param {Error} error - The error from an API call
 * @param {function} showToast - The toast function from useToast hook
 * @param {object} options - Configuration options
 * @param {string} options.context - Context about where the error occurred
 * @param {string} options.endpoint - The API endpoint that failed
 * @param {function} options.onError - Custom error handler (optional)
 * @param {string} options.fallbackMessage - Custom fallback message (optional)
 */
export const handleApiError = (error, showToast, options = {}) => {
  const {
    context = '',
    endpoint = '',
    onError = null,
    fallbackMessage = null
  } = options;

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    try {
      onError(error);
    } catch (customError) {
      console.error('Custom error handler failed:', customError);
    }
  }

  const errorInfo = handleError(error, context, endpoint);
  
  // Use fallback message if provided, otherwise use the handled message
  const message = fallbackMessage || errorInfo.message;
  const toastType = errorInfo.severity === 'error' ? 'error' : 'warning';
  
  showToast(message, toastType);
  
  // In development, log technical details
  if (process.env.NODE_ENV === 'development') {
    console.group(`API Error: ${context}`);
    console.error('Original error:', error);
    console.warn('Error info:', errorInfo);
    console.groupEnd();
  }
};

/**
 * Wrapper for API calls that automatically handles errors with toast notifications
 * 
 * @param {function} apiCall - The API function to call
 * @param {function} showToast - The toast function from useToast hook
 * @param {object} options - Configuration options
 * @returns {Promise} - The result of the API call or null if error
 */
export const safeApiCall = async (apiCall, showToast, options = {}) => {
  const {
    context = 'API call',
    endpoint = '',
    onSuccess = null,
    onError = null,
    suppressErrors = false
  } = options;

  try {
    const result = await apiCall();
    
    // Call success handler if provided
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(result);
    }
    
    return result;
  } catch (error) {
    // Only show toast if not suppressed
    if (!suppressErrors) {
      handleApiError(error, showToast, { context, endpoint, onError });
    }
    
    return null;
  }
};

/**
 * Create a toast-enabled version of an API function
 * 
 * @param {function} apiFunction - The original API function
 * @param {string} context - Context for error messages
 * @param {string} endpoint - API endpoint for specific error handling
 * @returns {function} - Enhanced API function that shows toast on errors
 */
export const createToastApi = (apiFunction, context, endpoint = '') => {
  return (showToast) => {
    return async (...args) => {
      try {
        return await apiFunction(...args);
      } catch (error) {
        displayApiError(error, showToast, context, endpoint);
        throw error; // Re-throw so calling code can still handle if needed
      }
    };
  };
};

export default {
  displayApiError,
  handleApiError,
  safeApiCall,
  createToastApi
};

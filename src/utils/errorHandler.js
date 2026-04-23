/**
 * Error Handler Utility
 * 
 * Provides consistent, user-friendly error handling across the application.
 * Converts generic HTTP errors into specific, actionable messages.
 */

import { logger } from './logger';

/**
 * Error message mappings for different API endpoints and error types
 */
const ERROR_MESSAGES = {
  // Network and connectivity errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'The request timed out. Please try again or contact support if the problem persists.',
  
  // Authentication and authorization
  UNAUTHORIZED: 'Your session has expired. Please refresh the page and log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  
  // Data validation errors
  VALIDATION_ERROR: 'Please check your input and ensure all required fields are filled correctly.',
  DUPLICATE_DATA: 'This data already exists in the system.',
  INVALID_FORMAT: 'The data format is invalid. Please check your input.',
  
  // File operations
  FILE_TOO_LARGE: 'The file is too large. Please select a file smaller than 50MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file format.',
  FILE_UPLOAD_FAILED: 'File upload failed. Please try again or contact support.',
  
  // Database and server errors
  DATABASE_ERROR: 'A database error occurred. Please try again or contact support.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later or contact support.',
  
  // Specific business logic errors
  BUILD_NOT_FOUND: 'Build not found. Please verify the build ID and try again.',
  PART_NUMBER_NOT_FOUND: 'Part number not found in the system.',
  SERIAL_NUMBER_EXISTS: 'This serial number already exists. Please use a different serial number.',
  INVALID_BUILD_STATUS: 'Cannot perform this action on a build with the current status.',
  REWORK_NOT_ALLOWED: 'Rework is not allowed for this build. Please contact your supervisor.',
  
  // Quality management
  QUALITY_CHECK_FAILED: 'Quality check failed. Please review the requirements and try again.',
  TEST_RESULTS_INVALID: 'Test results are invalid or incomplete.',
  
  // Customer escalation
  ESCALATION_FAILED: 'Failed to create customer escalation. Please try again.',
  NOTIFICATION_FAILED: 'Failed to send notification. The escalation was created but notifications may be delayed.',
};

/**
 * Maps HTTP status codes to specific error categories
 */
const STATUS_CODE_MAPPINGS = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'DUPLICATE_DATA',
  413: 'FILE_TOO_LARGE',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'SERVER_ERROR',
  502: 'SERVER_ERROR',
  503: 'SERVER_ERROR',
  504: 'TIMEOUT_ERROR',
};

/**
 * Context-specific error mappings based on API endpoint
 */
const ENDPOINT_ERROR_MAPPINGS = {
  '/platform-info': {
    404: 'Part number not found. Please verify the system part number and try again.',
    500: 'Unable to retrieve platform information. Please try again or contact support.',
  },
  '/part-numbers/search': {
    404: 'No matching part numbers found.',
    500: 'Part number search is temporarily unavailable. Please try again later.',
  },
  '/check-duplicates': {
    400: 'Invalid serial number format. Please check your input.',
    409: 'Duplicate serial numbers detected. Please use unique serial numbers.',
    500: 'Unable to verify serial numbers. Please try again.',
  },
  '/builds': {
    400: 'Invalid build data. Please check all required fields.',
    404: 'Build not found. Please verify the build ID.',
    409: 'A build with this information already exists.',
    500: 'Unable to save build. Please try again or contact support.',
  },
  '/builds/search': {
    404: 'No builds found matching your search criteria.',
    500: 'Build search is temporarily unavailable. Please try again later.',
  },
  '/file-upload': {
    400: 'Invalid file format or file is corrupted.',
    413: 'File is too large. Maximum file size is 50MB.',
    415: 'File type not supported. Please use a supported format.',
    500: 'File upload failed. Please try again or contact support.',
  },
  '/bkc-versions': {
    404: 'No BKC versions found for this platform.',
    500: 'Unable to retrieve BKC versions. Please try again later.',
  },
  '/quality': {
    400: 'Invalid quality data. Please check your input.',
    404: 'Quality record not found.',
    500: 'Quality system is temporarily unavailable. Please try again later.',
  },
  '/rework': {
    400: 'Invalid rework data or rework not allowed for this build.',
    403: 'You do not have permission to perform rework operations.',
    404: 'Build not found or not eligible for rework.',
    500: 'Rework system is temporarily unavailable. Please try again later.',
  },
  '/escalation': {
    400: 'Invalid escalation data. Please check all required fields.',
    500: 'Unable to create escalation. Please try again or contact support directly.',
  },
};

/**
 * Enhanced error handler that provides specific, user-friendly error messages
 * 
 * @param {Error} error - The error object from axios or other sources
 * @param {string} context - Additional context about where the error occurred
 * @param {string} endpoint - The API endpoint that failed (optional)
 * @returns {object} - { message: string, severity: string, code: string }
 */
export const handleError = (error, context = '', endpoint = '') => {
  logger.error(`Error in ${context}:`, error);

  // Handle network errors (no response from server)
  if (!error.response) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH') {
      return {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        severity: 'error',
        code: 'NETWORK_ERROR',
        technical: 'Server unreachable'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        severity: 'error',
        code: 'TIMEOUT_ERROR',
        technical: 'Request timeout'
      };
    }

    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      severity: 'error',
      code: 'UNKNOWN_NETWORK_ERROR',
      technical: error.message
    };
  }

  const { status, data } = error.response;
  
  // Check for server-provided specific message first, before endpoint mappings
  if (data && data.message && data.message.length < 200 && !data.message.includes('Error:')) {
    return {
      message: data.message,
      severity: status >= 500 ? 'error' : 'warning',
      code: `HTTP_${status}`,
      technical: data.error || data.stack || 'No additional details'
    };
  }

  // Check for specific endpoint error mappings
  if (endpoint && ENDPOINT_ERROR_MAPPINGS[endpoint] && ENDPOINT_ERROR_MAPPINGS[endpoint][status]) {
    return {
      message: ENDPOINT_ERROR_MAPPINGS[endpoint][status],
      severity: status >= 500 ? 'error' : 'warning',
      code: `${endpoint.toUpperCase()}_${status}`,
      technical: data?.message || data?.error || 'No additional details'
    };
  }

  // Check for server-provided error message
  if (data && typeof data === 'object') {
    // Handle specific error types from server
    if (data.invalidM2SN) {
      return {
        message: 'M.2 Serial Number must start with the letter "S".',
        severity: 'warning',
        code: 'INVALID_M2_SERIAL',
        technical: 'M.2 serial number format validation failed'
      };
    }
    
    if (data.notFound) {
      return {
        message: ERROR_MESSAGES.BUILD_NOT_FOUND,
        severity: 'warning',
        code: 'BUILD_NOT_FOUND',
        technical: data.message || 'Resource not found'
      };
    }
    
    if (data.invalidStatus) {
      return {
        message: 'Build must be saved before this operation can be performed.',
        severity: 'warning',
        code: 'INVALID_BUILD_STATUS',
        technical: 'Build status validation failed'
      };
    }
    
    if (data.duplicates) {
      const duplicateFields = Object.keys(data.duplicates).join(', ');
      return {
        message: `Duplicate entries found for: ${duplicateFields}. Please use unique values.`,
        severity: 'warning',
        code: 'DUPLICATE_ENTRIES',
        technical: JSON.stringify(data.duplicates)
      };
    }

  }

  // Fall back to status code mappings
  const errorType = STATUS_CODE_MAPPINGS[status];
  if (errorType && ERROR_MESSAGES[errorType]) {
    return {
      message: ERROR_MESSAGES[errorType],
      severity: status >= 500 ? 'error' : 'warning',
      code: errorType,
      technical: data?.message || data?.error || `HTTP ${status}`
    };
  }

  // Default fallback for unknown errors
  return {
    message: status >= 500 
      ? ERROR_MESSAGES.SERVER_ERROR 
      : 'An unexpected error occurred. Please try again.',
    severity: status >= 500 ? 'error' : 'warning',
    code: `HTTP_${status}`,
    technical: data?.message || error.message || 'Unknown error'
  };
};

/**
 * Simplified error handler for components that just need a user message
 * 
 * @param {Error} error - The error object
 * @param {string} context - Context about where the error occurred
 * @param {string} endpoint - The API endpoint (optional)
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error, context = '', endpoint = '') => {
  const errorInfo = handleError(error, context, endpoint);
  return errorInfo.message;
};

/**
 * Create a consistent error object for throwing
 * 
 * @param {string} message - User-friendly message
 * @param {string} code - Error code
 * @param {any} technical - Technical details
 * @returns {Error} - Enhanced error object
 */
export const createError = (message, code = 'UNKNOWN_ERROR', technical = null) => {
  const error = new Error(message);
  error.code = code;
  error.technical = technical;
  return error;
};

export default {
  handleError,
  getErrorMessage,
  createError,
  ERROR_MESSAGES
};

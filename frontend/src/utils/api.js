/**
 * API Utility Functions
 * Centralized API handling with proper error management
 */

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Constructs the full API URL
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL
 */
export function apiUrl(endpoint) {
  return `${API_URL}${endpoint}`;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Fetches data from the API with proper error handling
 * @param {string} endpoint - API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Response data
 * @throws {ApiError} On API errors
 */
export async function apiFetch(endpoint, options = {}) {
  const url = apiUrl(endpoint);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = isJson && data.error 
        ? data.error 
        : `HTTP Error: ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      null
    );
  }
}

/**
 * GET request helper
 */
export async function apiGet(endpoint) {
  return apiFetch(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost(endpoint, body) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request helper
 */
export async function apiPut(endpoint, body) {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' });
}

export default { apiUrl, apiFetch, apiGet, apiPost, apiPut, apiDelete, ApiError };

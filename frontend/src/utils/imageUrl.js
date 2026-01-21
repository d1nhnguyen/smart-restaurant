import axios from 'axios';

/**
 * Get the full URL for an image path
 * Handles both relative paths (/uploads/...) and absolute URLs (https://...)
 */
export const getImageUrl = (url) => {
    if (!url) return null;

    // If already an absolute URL (e.g., from external source or blob), return as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
        return url;
    }

    // For relative paths, prepend the API base URL
    return `${axios.defaults.baseURL}${url}`;
};

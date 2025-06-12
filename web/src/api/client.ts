import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY,
    'x-user-tier': 'free' // We can make this configurable later
  }
});

// Log the actual origin
console.log('Current origin:', window.location.origin);

export default apiClient; 
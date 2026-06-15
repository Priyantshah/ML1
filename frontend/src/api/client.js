import axios from 'axios';


const getApiUrl = () => {
    const buildUrl = import.meta.env.VITE_API_URL;
    if (buildUrl && buildUrl !== '/api' && !buildUrl.startsWith('http://localhost:3002')) {
        return buildUrl;
    }
    // Dynamic runtime routing based on environment
    if (typeof window !== 'undefined' && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('automl-builder-frontend'))) {
        return 'https://automl-backend-copy-copy-copy-production.up.railway.app/api';
    }
    return 'http://localhost:3002/api';
};

const baseURL = getApiUrl();


const client = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for multipart/form-data if needed, but axios handles it automatically if data is FormData
// We can add error handling interceptors here too

export default client;

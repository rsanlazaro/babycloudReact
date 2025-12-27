import axios from 'axios';

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const api = axios.create({
  baseURL: isLocalhost
    ? 'http://localhost:4000'
    : 'https://babycloudreact-backend.onrender.com',
  withCredentials: true,
});

export default api;
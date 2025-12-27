import axios from 'axios';

const api = axios.create({
  baseURL: 'https://babycloudreact-backend.onrender.com',
  withCredentials: true,
});

export default api;
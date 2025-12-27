import axios from 'axios';

const api = axios.create({
  baseURL: 'https://babycloud.netlify.app',
  withCredentials: true,
});

export default api;
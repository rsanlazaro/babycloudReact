import axios from 'axios';

const api = axios.create({
  baseURL: 'http://babycloud.netlify.app',
  withCredentials: true,
});

export default api;
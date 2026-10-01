import axios from 'axios';

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// In production the API is called on THIS site (relative "/api/..."), and
// Netlify forwards it to the Render backend (see public/_redirects).
// Calling Render directly made the session cookie a third-party cookie, which
// incognito windows, Safari and Firefox (strict) block → "Unauthorized" right
// after logging in.
const api = axios.create({
  baseURL: isLocalhost ? 'http://localhost:4000' : '',
  withCredentials: true,
});

export default api;
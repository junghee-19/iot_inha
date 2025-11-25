const DEFAULT_BACKEND_URL = 'http://localhost:5001';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || DEFAULT_BACKEND_URL;

export const BUILDING_FEED_ENDPOINT = `${BACKEND_URL}/api/building`;

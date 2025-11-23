// ws-server.mjs
const DEFAULT_WS_URL = 'ws://localhost:6060';
let socketRef = null;

const resolveWsUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  if (typeof process !== 'undefined') {
    if (process.env.VITE_WS_URL) {
      return process.env.VITE_WS_URL;
    }
    if (process.env.WS_URL) {
      return process.env.WS_URL;
    }
  }

  return DEFAULT_WS_URL;
};

const initSocket = () => {
  const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';
  if (!isBrowser) {
    console.warn('[ws] initSocket skipped - browser WebSocket API not available.');
    return null;
  }

  if (socketRef && socketRef.readyState <= window.WebSocket.OPEN) {
    return socketRef;
  }

  const targetUrl = resolveWsUrl();
  socketRef = new window.WebSocket(targetUrl);

  socketRef.addEventListener('open', () => {
    console.info(`[ws] connected to ${targetUrl}`);
  });

  socketRef.addEventListener('message', (event) => {
    console.info('[ws] message received:', event.data);
  });

  socketRef.addEventListener('close', (event) => {
    console.info('[ws] connection closed', event.code, event.reason || '');
    socketRef = null;
  });

  socketRef.addEventListener('error', (event) => {
    console.error('[ws] connection error', event);
  });

  return socketRef;
};

export { initSocket };

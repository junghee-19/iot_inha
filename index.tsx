
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSocket } from './websocket/websocket.mjs';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
initSocket();
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initDevAuthInterceptor } from './devAuthInterceptor.js';

// Initialize dev auth interceptor (noop in production)
initDevAuthInterceptor();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

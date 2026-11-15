import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initDevAuthInterceptor } from './devAuthInterceptor.js';
import { initApiInterceptor } from './services/api.js';

// Initialize dev auth interceptor (noop in production)
initDevAuthInterceptor();

// Initialize API token interceptor
initApiInterceptor();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

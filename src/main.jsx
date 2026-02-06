import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { EnvironmentProvider } from './contexts/EnvironmentContext';
import { AuthProvider } from './contexts/AuthContext';
import { EntityProvider } from './contexts/EntityContext';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <EnvironmentProvider>
        <AuthProvider>
          <EntityProvider>
            <App />
          </EntityProvider>
        </AuthProvider>
      </EnvironmentProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

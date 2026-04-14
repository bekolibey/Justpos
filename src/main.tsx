import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import './index.css';
import { POSProvider } from './state/POSContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <POSProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </POSProvider>
  </React.StrictMode>,
);

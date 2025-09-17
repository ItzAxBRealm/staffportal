import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/styles/responsive.css'
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './stores/store.js';
import { Toaster } from 'sonner';
import { initializeAuth } from './utils/authLoader';

initializeAuth(store).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <Toaster richColors position="top-right" />
          <App />
        </Provider>
      </BrowserRouter>
    </StrictMode>,
  );
})

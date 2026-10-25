import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.tsx';
import { store } from './state/store';
import { applyThemeToDocument, getInitialTheme } from './hooks/useTheme';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';

const Devtools = import.meta.env.DEV && import.meta.env.VITE_QUERY_DEVTOOLS === 'true' ? lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools }))) : null;

applyThemeToDocument(getInitialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" />
        {Devtools && <Suspense fallback={null}><Devtools initialIsOpen={false} /></Suspense>}
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);

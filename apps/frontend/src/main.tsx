import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ColorSchemeScript, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppMantineProvider } from './components/system/AppMantineProvider';
import { COLOR_SCHEME_STORAGE_KEY } from './constants';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/400-italic.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/600-italic.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/700-italic.css';
import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import 'highlight.js/styles/atom-one-dark.css';
import './styles/links.css';
import './styles/table-rows.css';
import './styles/theme-dark.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const colorSchemeManager = localStorageColorSchemeManager({
  key: COLOR_SCHEME_STORAGE_KEY,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" localStorageKey={COLOR_SCHEME_STORAGE_KEY} />
    <QueryClientProvider client={queryClient}>
      <AppMantineProvider colorSchemeManager={colorSchemeManager}>
        <Notifications position="bottom-right" />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppMantineProvider>
    </QueryClientProvider>
  </StrictMode>
);

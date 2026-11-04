import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ColorSchemeScript, MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LANDING_COLOR_SCHEME_STORAGE_KEY } from './config/colorScheme';
import { landingTheme } from './theme';
import '@mantine/core/styles.css';
import './styles/theme-dark.css';
import './styles/theme-light.css';
import './styles/landing.css';

const colorSchemeManager = localStorageColorSchemeManager({
  key: LANDING_COLOR_SCHEME_STORAGE_KEY,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript
      defaultColorScheme="auto"
      localStorageKey={LANDING_COLOR_SCHEME_STORAGE_KEY}
    />
    <MantineProvider
      theme={landingTheme}
      defaultColorScheme="auto"
      colorSchemeManager={colorSchemeManager}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
);

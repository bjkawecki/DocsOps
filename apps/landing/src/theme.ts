import { createTheme } from '@mantine/core';

/** Sky-leaning blue; primary accent at index 4 (#4690f7). */
const blueScale = [
  '#eef6ff',
  '#dcf0ff',
  '#bfe0ff',
  '#93c8ff',
  '#4690f7',
  '#2b77eb',
  '#2b77eb',
  '#1f62d4',
  '#1f52ad',
  '#1e468a',
] as const;

export const landingTheme = createTheme({
  primaryColor: 'blue',
  primaryShade: 4,
  colors: {
    blue: [...blueScale],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

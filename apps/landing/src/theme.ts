import { createTheme } from '@mantine/core';

const blueScale = [
  '#eef2ff',
  '#dae2ff',
  '#bdccff',
  '#90acff',
  '#5e82ff',
  '#3554fc',
  '#1f32f1',
  '#171ede',
  '#191bb4',
  '#1a1e8e',
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

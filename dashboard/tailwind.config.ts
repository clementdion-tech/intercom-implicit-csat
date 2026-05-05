import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'score-very-low': '#e53935',
        'score-low': '#fb8c00',
        'score-mid': '#fdd835',
        'score-high': '#7cb342',
        'score-very-high': '#2e7d32',
      },
    },
  },
  plugins: [],
};

export default config;

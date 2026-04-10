/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0b1e2d',
          light: '#122840',
          dark: '#071520',
        },
        teal: {
          DEFAULT: '#1fa2b8',
          light: '#34bcd4',
          dark: '#167d8e',
        },
        gold: {
          DEFAULT: '#c98a5a',
          light: '#dba97a',
          dark: '#a66b3e',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

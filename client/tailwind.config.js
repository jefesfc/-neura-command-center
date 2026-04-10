/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'rgb(var(--tw-navy) / <alpha-value>)',
          light: 'rgb(var(--tw-navy-light) / <alpha-value>)',
          dark: 'rgb(var(--tw-navy-dark) / <alpha-value>)',
        },
        teal: {
          DEFAULT: 'rgb(var(--tw-teal) / <alpha-value>)',
          light: 'rgb(var(--tw-teal-light) / <alpha-value>)',
          dark: 'rgb(var(--tw-teal-dark) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--tw-gold) / <alpha-value>)',
          light: 'rgb(var(--tw-gold-light) / <alpha-value>)',
          dark: 'rgb(var(--tw-gold-dark) / <alpha-value>)',
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

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        gh: {
          bg: '#0d1117',
          card: '#161b22',
          badge: '#21262d',
          border: '#30363d',
          'text-primary': '#e6edf3',
          'text-secondary': '#8b949e',
          accent: '#58a6ff',
          'accent-hover': '#79b8ff',
          danger: '#f85149',
        },
        contrib: {
          none: '#161b22',
          q1: '#0e4429',
          q2: '#006d32',
          q3: '#26a641',
          q4: '#39d353',
        },
      },
    },
  },
  plugins: [],
}

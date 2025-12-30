/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Misty teal palette - matches the banner
        primary: '#2d5a4a',
        secondary: '#1e4035',
        accent: '#4a7c6a',
        // Extended palette
        palm: {
          50: '#f5f9f7',
          100: '#e8f0ec',
          200: '#d4e4db',
          300: '#a8d4c0',
          400: '#6b9c83',
          500: '#4a7c6a',
          600: '#2d5a4a',
          700: '#1e4035',
          800: '#162e27',
          900: '#0f1f1a',
        },
      },
    },
  },
  plugins: [],
}

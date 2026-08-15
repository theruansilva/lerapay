/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lera: {
          purple: '#958BC2',
          'purple-hover': '#7a6fa8',
          'purple-light': '#ded9f2',
          'purple-dark': '#4b3f72',
          black: '#000000',
          dark: '#0E0E0E',
          card: '#1B1B1B',
          'card-hover': '#242424',
          'card-border': '#2E2E2E',
          muted: '#abb8c3',
          subtext: '#94a3b8',
        },
        brand: {
          50: '#f7f6fc',
          100: '#eeeaf8',
          200: '#ded9f2',
          300: '#c5bde6',
          400: '#ac9fd8',
          500: '#958BC2',
          600: '#7e72ab',
          700: '#675c91',
          800: '#544b76',
          900: '#463f61',
          950: '#2b263d',
        },
      },
      fontFamily: {
        sans: ['Gilroy', 'Poppins', 'sans-serif'],
        gilroy: ['Gilroy', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        ostrich: ['Ostrich Sans', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

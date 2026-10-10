/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pikka: {
          dark: '#082f32',
          deep: '#0c3d40',
          teal: '#0e7075',
          cyan: '#1bb3b8',
          light: '#3ec5c9',
          mint: '#d4f2ee',
        },
      },
      fontFamily: {
        brand: ['Quicksand', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'pikka-dark': 'linear-gradient(160deg, #0c3c3e 0%, #092e31 40%, #062022 100%)',
        'pikka-light': 'linear-gradient(160deg, #f4faf8 0%, #eaf6f4 50%, #def0ec 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

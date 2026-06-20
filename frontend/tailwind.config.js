/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#0A0A0A',
        surface: '#121212',
        surfaceHover: '#1A1A1A',
        surfaceBorder: '#27272A', // zinc-800
        primary: {
          400: '#818CF8', // indigo-400
          500: '#6366F1', // indigo-500
          600: '#4F46E5', // indigo-600
        },
        accent: {
          400: '#A78BFA', // violet-400
          500: '#8B5CF6', // violet-500
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}

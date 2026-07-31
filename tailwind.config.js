/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#040308',
          900: '#0a0710',
          850: '#100c1a',
          800: '#171224',
          700: '#221b32',
          600: '#302645',
        },
        crimson: {
          300: '#ff8792',
          400: '#ff4d5e',
          500: '#e50914',
          600: '#c1121f',
          700: '#8b0d16',
          900: '#4a060c',
        },
        gold: {
          100: '#fff8e1',
          200: '#ffeaa7',
          300: '#f9d976',
          400: '#f5c518',
          500: '#d4af37',
          600: '#a8842a',
          700: '#6f5518',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', '"Arial Narrow"', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(245,197,24,0.35), 0 8px 40px -12px rgba(245,197,24,0.45)',
        crimson: '0 0 0 1px rgba(229,9,20,0.4), 0 10px 44px -14px rgba(229,9,20,0.65)',
        deep: '0 24px 60px -24px rgba(0,0,0,0.9)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.07)',
      },
      backgroundImage: {
        'gold-sheen': 'linear-gradient(103deg,#6f5518 0%,#f5c518 28%,#fff8e1 46%,#f5c518 62%,#a8842a 100%)',
        'curtain': 'radial-gradient(120% 90% at 50% -10%, rgba(229,9,20,0.35) 0%, rgba(10,7,16,0) 60%)',
        'stage': 'radial-gradient(80% 60% at 50% 0%, rgba(245,197,24,0.14) 0%, rgba(4,3,8,0) 70%)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.35' },
          '50%': { transform: 'translateY(-26px) rotate(8deg)', opacity: '0.9' },
        },
        drift: {
          '0%': { transform: 'translate3d(0,110vh,0) scale(0.6)', opacity: '0' },
          '12%': { opacity: '0.8' },
          '88%': { opacity: '0.8' },
          '100%': { transform: 'translate3d(0,-12vh,0) scale(1.1)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245,197,24,0.5)' },
          '50%': { boxShadow: '0 0 0 14px rgba(245,197,24,0)' },
        },
        flicker: {
          '0%,100%': { opacity: '1' },
          '42%': { opacity: '0.72' },
          '46%': { opacity: '1' },
          '58%': { opacity: '0.55' },
          '62%': { opacity: '1' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        bulb: {
          '0%,100%': { opacity: '1', filter: 'brightness(1.4)' },
          '50%': { opacity: '0.35', filter: 'brightness(0.7)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        drift: 'drift linear infinite',
        shimmer: 'shimmer 4.5s linear infinite',
        pulseGlow: 'pulseGlow 2.2s ease-out infinite',
        flicker: 'flicker 5s linear infinite',
        sweep: 'sweep 2.6s ease-in-out infinite',
        bulb: 'bulb 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

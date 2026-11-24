/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      /* Paleta brutalista: colores planos, saturados y alto contraste */
      colors: {
        brutal: {
          ink: '#0A0A0A',
          cream: '#FFF8E7',
          yellow: '#FFE14D',
          pink: '#FF6B9D',
          blue: '#4D7CFF',
          lime: '#A3FF47',
          red: '#FF4D4D',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'Impact', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      /* Sombras duras sin difuminado (seña de identidad del brutalismo) */
      boxShadow: {
        'brutal-sm': '3px 3px 0 0 #0A0A0A',
        brutal: '6px 6px 0 0 #0A0A0A',
        'brutal-lg': '10px 10px 0 0 #0A0A0A',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        /* "backwards" para no bloquear las transformaciones de hover al terminar */
        pop: 'pop 300ms ease-out backwards',
        'slide-up': 'slide-up 250ms cubic-bezier(0.2, 0.9, 0.3, 1.2) backwards',
      },
    },
  },
  plugins: [],
};
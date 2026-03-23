import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D4847C',
          hover: '#C4746C',
          light: '#E8A9A3',
        },
        secondary: '#F7F3EF',
        accent: {
          DEFAULT: '#B8860B',
          light: '#D4A84B',
        },
        dark: {
          DEFAULT: '#3D3D3D',
          light: '#5D5D5D',
        },
        light: {
          DEFAULT: '#FFFFFF',
          alt: '#FAFAFA',
        },
        success: {
          DEFAULT: '#8FBC8F',
          dark: '#6B9B6B',
        },
        warning: '#E8B86D',
        info: '#7BA3C4',
        border: {
          DEFAULT: '#E8E4E0',
          dark: '#D4D0CC',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        accent: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(61, 61, 61, 0.08)',
        'md': '0 4px 20px rgba(61, 61, 61, 0.12)',
        'lg': '0 10px 40px rgba(61, 61, 61, 0.15)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': {
            transform: 'translateY(-10%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fadeScaleIn': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        'bounce-gentle': 'bounce-gentle 1s infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fadeScaleIn': 'fadeScaleIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;

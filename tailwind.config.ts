import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          dark: '#1E40AF',
          soft: '#E8EEFF',
        },
        ink: '#1F2937',
        muted: '#6B7280',
        surface: '#F3F5FB',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(25, 72, 191, 0.08)',
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;

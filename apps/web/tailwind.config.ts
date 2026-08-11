import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#17324D', // Primary Navy
          800: '#1F4E79', // Enterprise Blue
        },
        enterprise: {
          blue: '#1F4E79',
          navy: '#17324D',
          bg: '#F7F8FA',     // Application background
          surface: '#FFFFFF',// Surface
          text: '#17202A',   // Primary text
          muted: '#5B6673',  // Secondary text
          border: '#D7DEE6', // Border
          success: '#2F6F52',// Success
          warning: '#A56A00',// Warning
          error: '#B42318',  // Error
          info: '#356A95',   // Information
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['26px', { lineHeight: '32px', fontWeight: '600' }],
        'section-title': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'table': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};

export default config;

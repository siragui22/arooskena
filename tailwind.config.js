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
        'aroosPink': '#FF69B4',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        arooskena: {
          "primary": "#FF69B4",
          "secondary": "#FF1493",
          "accent": "#FFB6C1",
          "neutral": "#2a323c",
          "base-100": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
}


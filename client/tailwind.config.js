/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{jsx,tsx}'],
  theme: {
    extend: {
      spacing: { 15: '60px' },
      colors: {
        font: '#043c4a',
        'font-0.14': 'rgba(4, 60, 74, 0.14)',
        'button-cancel': '#777777',
        brand: '#1c827f',
        brand1: '#043c4a',
        button: '#1c827f',
        secondaryCol: '#142945',
        tertiary: '#8994A2'
      }
    }
  },
  plugins: []
}

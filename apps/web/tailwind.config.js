// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Terminal colors
        'terminal': {
          'bg': '#0a0a0a',
          'green': '#00ff41',
          'amber': '#ffb74d',
          'red': '#ff5722',
        },
        // Discord brand colors
        'discord': {
          '500': '#5865F2',
          '600': '#4752C4',
        },
        // Status colors
        'status': {
          'win': '#4caf50',
          'lose': '#f44336',
          'fun': '#ffeb3b',
          'neutral': '#999999',
        },
        // Surface colors
        'surface': {
          'primary': '#0d0d0d',
          'secondary': '#1a1a1a',
        },
        // Custom orange for landing
        'orange': {
          '400': '#ff7849',
          '500': '#ff6533',
          '600': '#e55529',
        }
      },
      borderColor: {
        'terminal-green': '#00ff41',
        'terminal-amber': '#ffb74d',
      },
      textColor: {
        'terminal-green': '#00ff41',
        'terminal-amber': '#ffb74d',
      },
      backgroundColor: {
        'terminal-bg': '#0a0a0a',
        'surface-primary': '#0d0d0d',
        'surface-secondary': '#1a1a1a',
      }
    },
  },
  plugins: [],
}
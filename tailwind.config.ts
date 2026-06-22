import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette — The Ambience Bureau
        bureau: {
          white:   '#FFFFFF',
          black:   '#000000',
          ink:     '#0A0A0A',
          muted:   '#666666',
          subtle:  '#999999',
          rule:    '#E0E0E0',
          surface: '#FAFAFA',
          amber:   '#E6792E', // the only warm accent — light itself
          'amber-dim': '#B85E20',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        bureau:   '0.08em',
        wide:     '0.12em',
        wider:    '0.18em',
        widest:   '0.25em',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}

export default config

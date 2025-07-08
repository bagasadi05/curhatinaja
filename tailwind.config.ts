import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-main': 'linear-gradient(135deg,#7D4CFF,#02C8FF)',
        'gradient-main-dark': 'linear-gradient(135deg,#835CFF,#00AEEF)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        headline: ['Playfair Display', 'serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        'bg-primary': '#F9F7FF',
        'text-primary': '#2B2770',
        'card-bg': 'rgba(255,255,255,0.6)',
        'danger': '#FF6161',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'slow-breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        },
        'breathing-pulse': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '33%': { transform: 'scale(1.1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0.7' },
        },
        'shadow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0px 0px hsl(var(--destructive) / 0.5)' },
          '50%': { boxShadow: '0 0 20px 10px hsl(var(--destructive) / 0.2)' },
        },
        'orb-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'orb-listening': {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.1)', filter: 'brightness(1.2)' },
        },
        'orb-swirl': {
          'from': { transform: 'rotate(0deg) scale(1.1)', filter: 'brightness(1.2)' },
          'to': { transform: 'rotate(360deg) scale(1.1)', filter: 'brightness(1.2)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slow-breathe': 'slow-breathe 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathing-pulse': 'breathing-pulse 12s ease-in-out infinite',
        'shadow-pulse': 'shadow-pulse 2s infinite ease-in-out',
        'orb-pulse': 'orb-pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orb-listening': 'orb-listening 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orb-swirl': 'orb-swirl 1s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

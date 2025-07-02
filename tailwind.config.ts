
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'noto': ['Noto Sans KR', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#FF6B6B',
					50: '#FFF5F5',
					100: '#FFE5E5',
					200: '#FFCCCC',
					300: '#FFB3B3',
					400: '#FF9999',
					500: '#FF6B6B',
					600: '#FF4D4D',
					700: '#FF2E2E',
					800: '#E60000',
					900: '#CC0000',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: '#4ECDC4',
					50: '#F0FFFE',
					100: '#E0FFFD',
					200: '#C2FFFB',
					300: '#A3FFF8',
					400: '#85FFF6',
					500: '#4ECDC4',
					600: '#2DBDB4',
					700: '#1E9B95',
					800: '#167873',
					900: '#0F5A56',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				accent: {
					DEFAULT: '#FFE66D',
					50: '#FFFDF0',
					100: '#FFFBE0',
					200: '#FFF7C2',
					300: '#FFF3A3',
					400: '#FFEF85',
					500: '#FFE66D',
					600: '#FFE04D',
					700: '#FFDA2E',
					800: '#E6C700',
					900: '#CCA800',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out'
			},
			boxShadow: {
				'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
				'card': '0 4px 12px 0 rgba(0, 0, 0, 0.1)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

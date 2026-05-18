/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Poppins', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: 'hsl(221 83% 53%)',
                    foreground: '#ffffff',
                    50: 'hsl(214 100% 97%)',
                    100: 'hsl(214 95% 93%)',
                    500: 'hsl(221 83% 53%)',
                    600: 'hsl(221 83% 45%)',
                    700: 'hsl(221 83% 38%)',
                },
                accent: {
                    DEFAULT: 'hsl(38 92% 50%)',
                    foreground: '#ffffff',
                },
                success: 'hsl(142 76% 36%)',
                danger: 'hsl(0 84% 60%)',
                warning: 'hsl(38 92% 50%)',
                sidebar: {
                    bg: 'hsl(222 47% 11%)',
                    hover: 'hsl(222 47% 18%)',
                    active: 'hsl(221 83% 53%)',
                    text: 'hsl(214 32% 91%)',
                    muted: 'hsl(215 20% 65%)',
                },
            },
            boxShadow: {
                card: '0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)',
                lg: '0 8px 30px rgba(0,0,0,.12)',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(262 83% 58%) 100%)',
                'gradient-hero': 'linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(221 83% 25%) 100%)',
            },
        },
    },
    plugins: [],
}

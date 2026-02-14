/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                discord: {
                    bg: '#000000',
                    'bg-app': '#1e1f22',
                    surface: '#2b2d31',
                    'surface-hover': '#313338',
                    'control-bar': '#232428',
                    blurple: '#5865F2',
                    success: '#23a559',
                    destructive: '#da373c',
                    'text-primary': '#f2f3f5',
                    'text-secondary': '#949ba4',
                },
            },
        },
    },
    plugins: [],
}

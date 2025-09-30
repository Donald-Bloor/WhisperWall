import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b1021",
        aqua: "#3ad6c9",
        lilac: "#c6b0f7",
        sand: "#f9e7d0",
        night: "#0f172a",
        mint: "#a7f3d0"
      },
      backgroundImage: {
        "mesh-wish": "radial-gradient(1000px 600px at 10% 10%, #3ad6c933 0, transparent 40%), radial-gradient(800px 500px at 90% 20%, #c6b0f733 0, transparent 45%), radial-gradient(900px 700px at 50% 90%, #a7f3d033 0, transparent 45%)"
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      animation: {
        shimmer: 'shimmer 8s linear infinite',
        float: 'float 3s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;



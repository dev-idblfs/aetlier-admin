import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf4f3",
          100: "#fce8e6",
          200: "#f9d5d1",
          300: "#f4b6ae",
          400: "#ec8c7e",
          500: "#e06652",
          600: "#c94a34",
          700: "#a83c29",
          800: "#8c3525",
          900: "#753124",
          DEFAULT: "#c94a34",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};

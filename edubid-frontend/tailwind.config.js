/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        educoin: {
          50: "#fff7ef",
          100: "#feeeda",
          200: "#fdd6b5",
          300: "#fcb07f",
          400: "#fb8a51",
          500: "#f9732a", // naranja principal
          600: "#dd5b20",
          700: "#b8491b",
          800: "#8f3916",
          900: "#6f2c12",
        },
        midnight: {
          50: "#e6e9f2",
          100: "#c0c6db",
          200: "#9aa3c4",
          300: "#7480ad",
          400: "#4e5d96",
          500: "#334377",
          600: "#27335d",
          700: "#1b2443",
          800: "#10152a", // midnight blue base
          900: "#080a14",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
}

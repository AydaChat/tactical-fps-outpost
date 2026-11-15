/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        tactical: {
          dark: "#0a0c10",
          panel: "#12161f",
          border: "#1f2937",
          accent: "#ff4655", // Valorant style red
          gold: "#eab308",
          cyan: "#00f0ff",
          green: "#10b981",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};

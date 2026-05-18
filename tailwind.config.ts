import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12151f",
        broadcast: "#f4483a",
        cyanline: "#15a6b8",
        mint: "#2ea77b",
        gold: "#d89a22",
        paper: "#f6f1e8"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(18, 21, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

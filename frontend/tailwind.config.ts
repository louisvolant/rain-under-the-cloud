import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
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
          primary: "#3B82F6", // Blue-500
          "primary-focus": "#2563EB", // Blue-600
          secondary: "#8B5CF6", // Purple-500
          "secondary-focus": "#7C3AED", // Purple-600
        },
       spacing: {
         'container': 'max-width: 80rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
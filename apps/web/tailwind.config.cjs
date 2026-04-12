module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf5ff",
          100: "#d9eaff",
          500: "#2563eb",
          700: "#1d4ed8",
          900: "#172554",
        },
        slateish: "#11203b",
        mint: "#c8f4d9",
        gold: "#f4d48f",
      },
      boxShadow: {
        panel: "0 24px 60px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};


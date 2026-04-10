import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#c026d3",
          dark: "#a21caf",
        },
        figma: {
          page: "#FAFBFC",
          sidebar: "#FFFFFF",
          sidebarBorder: "#E8EAED",
          card: "#FFFFFF",
          cardBorder: "#E5E7EB",
          activeMenu: "#FFE4E4",
          activeMenuText: "#AA1229",
          headerTitle: "#1a1a1a",
          adminSub: "#6B7280",
          label: "#4B5563",
          trendUpBg: "#D1FAE5",
          trendUp: "#059669",
          trendDownBg: "#FEE2E2",
          trendDown: "#DC2626",
          tableHeader: "#F9FAFB",
          tableBorder: "#E5E7EB",
          tableRowBorder: "#F3F4F6",
          tableRowHover: "#F9FAFB",
          statusPendingBg: "#FEF3C7",
          statusPending: "#D97706",
          chartLine: "#10B981",
          chartGrid: "#E5E7EB",
          dropdownBorder: "#D1D5DB",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        cardHover: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        sidebar: "2px 0 12px rgb(0 0 0 / 0.04)",
        header: "0 1px 3px rgb(0 0 0 / 0.05)",
        input: "0 0 0 3px rgb(214 54 78 / 0.12)",
      },
      borderRadius: {
        card: "12px",
        button: "10px",
        input: "10px",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;

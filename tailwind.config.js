/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        alpine: {
          mist: "var(--alpine-mist)",
          low: "var(--alpine-low)",
          container: "var(--alpine-container)",
          high: "var(--alpine-high)",
        },
        forest: {
          midnight: "var(--forest-midnight)",
          container: "var(--forest-container)",
        },
        teal: {
          iridescence: "var(--teal-iridescence)",
          container: "var(--teal-container)",
          fixed: "var(--teal-fixed)",
          containerText: "var(--teal-container-text)",
        },
        ink: {
          primary: "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          outline: "var(--ink-outline)",
          outlineVariant: "var(--ink-outline-variant)",
        },
        auric: {
          container: "var(--auric-container)",
          text: "var(--auric-text)",
        },
        // Status semantic colors
        status: {
          success: "var(--status-success)",
          successText: "var(--status-success-text)",
          successBg: "var(--status-success-bg)",
          warning: "var(--status-warning)",
          warningText: "var(--status-warning-text)",
          warningBg: "var(--status-warning-bg)",
          danger: "var(--status-danger)",
          dangerText: "var(--status-danger-text)",
          dangerBg: "var(--status-danger-bg)",
          info: "var(--status-info)",
          infoText: "var(--status-info-text)",
          infoBg: "var(--status-info-bg)",
        },
        surface: "var(--surface)",
      },
      fontFamily: {
        display: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        ambient: "0 1px 3px 0 rgba(11, 43, 38, 0.06), 0 4px 20px -2px rgba(11, 43, 38, 0.04)",
        card: "0 1px 2px 0 rgba(11, 43, 38, 0.05), 0 2px 8px -2px rgba(11, 43, 38, 0.06)",
        "card-hover": "0 2px 8px 0 rgba(11, 43, 38, 0.08), 0 8px 24px -4px rgba(11, 43, 38, 0.10)",
        glow: "0 0 0 3px rgba(108, 250, 215, 0.25)",
        "glow-strong": "0 0 0 4px rgba(108, 250, 215, 0.35)",
        "dark-ambient": "0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 4px 24px -4px rgba(0, 0, 0, 0.35)",
        modal: "0 20px 60px -10px rgba(0, 21, 17, 0.5)",
        sidebar: "4px 0 24px -4px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        card: "16px",
        xl2: "20px",
      },
      spacing: {
        4.5: "18px",
        5.5: "22px",
        13: "52px",
        15: "60px",
        18: "72px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-left": "slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        250: "250ms",
      },
    },
  },
  plugins: [],
};
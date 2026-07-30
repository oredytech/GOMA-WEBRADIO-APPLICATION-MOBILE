// Tailwind CDN config script content — injected in __root head via a <script> tag.
// Color tokens resolve to CSS variables declared in src/styles.css (light + .dark).
export const tailwindConfigScript = `
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--gw-paper) / <alpha-value>)",
        panel: "rgb(var(--gw-panel) / <alpha-value>)",
        panel2: "rgb(var(--gw-panel-2) / <alpha-value>)",
        ink: "rgb(var(--gw-ink) / <alpha-value>)",
        inkmute: "rgb(var(--gw-ink-mute) / <alpha-value>)",
        line: "rgb(var(--gw-line) / <alpha-value>)",
        brand: "rgb(var(--gw-brand) / <alpha-value>)",
        "brand-deep": "rgb(var(--gw-brand-deep) / <alpha-value>)",
        blood: "rgb(var(--gw-blood) / <alpha-value>)"
      },
      fontFamily: {
        display: ["Funnel Display", "system-ui", "sans-serif"],
        sans: ["Funnel Sans", "system-ui", "sans-serif"]
      },
      borderRadius: { DEFAULT: "0.875rem", lg: "1.25rem", xl: "1.75rem", "2xl": "2rem" },
      boxShadow: {
        soft: "0 6px 24px -12px rgb(1 27 64 / 0.25)",
        lift: "0 18px 40px -20px rgb(1 27 64 / 0.45)"
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "none" } },
        "eq": { "0%,100%": { transform: "scaleY(0.35)" }, "50%": { transform: "scaleY(1)" } }
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(.2,.8,.2,1) both",
        eq: "eq 1s ease-in-out infinite"
      }
    }
  }
};
`;

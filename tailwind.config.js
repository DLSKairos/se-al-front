/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0C1624',
        'navy-mid': '#111E30',
        'navy-light': '#162238',
        signal: '#00D4FF',
        amber: '#F5A623',
        'off-white': '#F0F4F8',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        fraunces: ['Fraunces', 'serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        senal: '2px',
        btn: '8px',
        glass: '18px',
        'glass-md': '12px',
        input: '10px',
        badge: '4px',
      },
      boxShadow: {
        signal: '0 0 20px rgba(0,212,255,0.35)',
        'signal-sm': '0 0 8px rgba(0,212,255,0.25)',
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}

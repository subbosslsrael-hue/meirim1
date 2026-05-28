/** @type {import('tailwindcss').Config} */
const DYNAMIC_COLORS = ['emerald', 'amber', 'orange', 'sky', 'rose', 'stone']
const SAFE_SHADES = ['50', '100', '200', '400', '500', '600', '700', '800']

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    ...DYNAMIC_COLORS.flatMap((c) => [
      ...SAFE_SHADES.map((s) => `bg-${c}-${s}`),
      ...SAFE_SHADES.map((s) => `text-${c}-${s}`),
      ...SAFE_SHADES.map((s) => `border-${c}-${s}`),
    ]),
    'bg-emerald-50/60',
    'bg-amber-50/60',
    'bg-orange-50/60',
    'bg-sky-50/60',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
        display: ['"Frank Ruhl Libre"', 'serif'],
      },
    },
  },
  plugins: [],
}

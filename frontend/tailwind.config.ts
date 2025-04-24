// frontend/tailwind.config.ts
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,ts,jsx,tsx}'],
	theme: {
	  extend: {
		 colors: {
			primary: '#4F46E5', // Индиго
			secondary: '#EC4899', // Розовый
			accent: '#10B981', // Зелёный
		 },
		 fontFamily: {
			sans: ['Comic Neue', 'sans-serif'],
		 },
	  },
	},
	plugins: [], // Убрали DaisyUI
 };
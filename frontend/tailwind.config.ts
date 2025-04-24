/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
	  './src/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
	  extend: {
		 colors: {
			primary: '#4F46E5', // Индиго для основного цвета
			secondary: '#EC4899', // Розовый для ховер-эффектов
			accent: '#10B981', // Зелёный для акцентов
		 },
		 fontFamily: {
			sans: ['Comic Neue', 'sans-serif'], // Мультяшный шрифт
		 },
	  },
	},
	plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "cupcake", "bumblebee"], // Яркие темы
  },
 };
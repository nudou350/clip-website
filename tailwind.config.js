module.exports = {
  purge: {
    content: [
      './src/**/*.{html,ts}'
    ]
  },
  darkMode: false, //or media or class
  content: [],
  theme: {
    extend: {},
  },
  variants:{
    extend: {
      opacity: ['disabled'],
      backgroundColor: ['disabled']
    },
  },
  plugins: [
    require("@tailwindcss/aspect-ratio")
  ],
}


module.exports = {
  root: true,
  env: {
    browser: true,
  },
  extends: ['plugin:vue/essential', '@vue/airbnb', 'prettier'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-restricted-syntax': 0,
    'no-unused-vars': 0,
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
  globals: {
    chrome: true,
  },
}

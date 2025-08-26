export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: { browser: true, node: true },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
];

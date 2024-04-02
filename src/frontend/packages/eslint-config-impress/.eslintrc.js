const common = require('./common');

module.exports = {
  root: true,
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:react/recommended',
  ],
  rules: common.globalRules,
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  ignorePatterns: ['node_modules'],
};

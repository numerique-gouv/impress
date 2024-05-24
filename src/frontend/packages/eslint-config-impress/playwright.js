const common = require('./common');

module.exports = {
  extends: ['next', 'plugin:prettier/recommended'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  parserOptions: {
    babelOptions: {
      presets: [require.resolve('next/babel')],
    },
  },
  rules: { ...common.globalRules, '@next/next/no-html-link-for-pages': 'off' },
  overrides: [
    ...common.eslintTS,
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
    {
      files: ['*.spec.*', '*.test.*', '**/__mock__/**/*'],
      extends: ['plugin:playwright/recommended'],
      plugins: ['playwright'],
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules'],
};

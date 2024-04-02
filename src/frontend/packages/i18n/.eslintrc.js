module.exports = {
  root: true,
  extends: ['impress/jest', 'plugin:import/recommended'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  ignorePatterns: ['node_modules'],
};

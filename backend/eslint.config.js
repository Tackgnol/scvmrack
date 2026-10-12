import tsParser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'tests/**/node_modules/**', 'tests/e2e/test-results/**', 'tests/e2e/playwright-report/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      // Every if/for/while body gets braces, even one-liners.
      curly: ['error', 'all'],
    },
  },
];

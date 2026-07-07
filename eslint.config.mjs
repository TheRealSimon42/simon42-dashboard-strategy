import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  {
    files: ['src/**/*.ts'],
    // The xss/no-mixed-html disables in src/editor/** target Codacy's legacy
    // ESLint 8 engine; locally the stub rule below reports nothing, so the
    // directives would be flagged as unused.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      // No-op stub so `eslint-disable xss/no-mixed-html` directives in the
      // editor panels are known rules locally. The real rule only runs in
      // Codacy's legacy ESLint 8 engine, where it mass-flags lit-html render
      // functions as raw-HTML false positives; the inline disables silence it
      // there while this stub keeps our own eslint run green.
      xss: { rules: { 'no-mixed-html': { create: () => ({}) } } },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Prettier handles formatting
      ...prettier.rules,
      // Pragmatic overrides
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'webpack.config.ts'],
  },
];

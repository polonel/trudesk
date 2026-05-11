const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'src/public/js/vendor/**',
      'src/public/js/plugins/**',
      'src/client/lib/vendor/**',
      'src/client/lib/plugins/**',
      'src/client/lib/**/*.min.js',
      'mobile-pwa/**',
      'mobile/**',
      'public/**',
      'src/typedefs/global.d.ts',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}', 'test/**/*.{ts,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        define: 'readonly',
        requirejs: 'readonly',
        MG: 'readonly',
        Snackbar: 'readonly',
        ROLES: 'readonly',
        io: 'readonly',
        d3: 'readonly',
        // browser
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // node
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        // mocha
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['eslint-recommended'].overrides?.[0]?.rules,
      ...tsPlugin.configs['recommended'].rules,
      'new-cap': 0,
      'no-console': 2,
      complexity: ['error', 30],
      '@typescript-eslint/no-extra-semi': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/no-require-imports': 0,
      'import/no-named-as-default': 'off',
      'node/no-missing-require': 'off',
      'node/no-unpublished-require': 'off',
      'node/exports-style': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
  {
    files: ['src/client/**/*.{js,jsx}', 'src/public/**/*.{js,jsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  prettierConfig,
]

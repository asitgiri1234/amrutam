/**
 * ESLint configuration.
 *
 * Two rule groups here are load-bearing for the architecture and are errors,
 * not warnings:
 *
 *  - `react-native/no-color-literals` — the design brief forbids inline colors.
 *    Every color must come from the theme so light/dark mode is correct by
 *    construction rather than by review.
 *  - `no-restricted-imports` — enforces the layering rules described in
 *    ARCHITECTURE.md so the dependency graph cannot quietly invert as the
 *    team grows.
 */
module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  plugins: ['@tanstack/query'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
    // Don't try to parse dependency source. React Native ships Flow-typed JS
    // that @babel/eslint-parser chokes on, and we gain nothing from linting
    // code we don't own.
    'import/ignore': ['node_modules'],
  },
  rules: {
    /* ---- Theming -------------------------------------------------------
     * `no-color-literals` is the rule that makes "no inline colors" real.
     *
     * `no-unused-styles` is OFF: it cannot see through our themed style
     * factories (`createStyles(theme)`) and flags every single style as
     * unused. A rule that is wrong 100% of the time trains people to ignore
     * lint output, which is worse than not having it.
     *
     * `no-inline-styles` is OFF because dynamic, theme-derived styles
     * (`{ backgroundColor: theme.colors.primary }`) are the correct pattern
     * here; `no-color-literals` already catches the case that matters. */
    'react-native/no-color-literals': 'error',
    'react-native/no-inline-styles': 'off',
    'react-native/no-unused-styles': 'off',

    /* ---- Pragmatics ----------------------------------------------------- */
    // `void promise` is our explicit "fire and forget, I know" marker.
    'no-void': ['error', { allowAsStatement: true }],
    // React Navigation's `screenOptions` render props are its documented API.
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    // Fires on `NetInfo.addEventListener`, which is the library's documented
    // default-export usage.
    'import/no-named-as-default-member': 'off',

    /* ---- TypeScript ---------------------------------------------------- */
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-console': ['error', { allow: ['warn', 'error'] }],

    /* ---- Imports ------------------------------------------------------- */
    'import/no-unresolved': 'error',
    'import/no-cycle': ['error', { maxDepth: 4 }],
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'react-native', group: 'external', position: 'before' },
          { pattern: '@/**', group: 'internal' },
          { pattern: '@*/**', group: 'internal' },
        ],
        pathGroupsExcludedImportTypes: ['react', 'react-native'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    /* ---- Layering ------------------------------------------------------ */
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@screens/*', '@modules/*'],
            message:
              'Foundation layers (design-system, api, storage, utils) must never import from feature layers. Dependencies point downward only.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Feature and composition layers may reach into screens/modules.
      files: [
        'src/screens/**/*',
        'src/modules/**/*',
        'src/navigation/**/*',
        'src/app/**/*',
        'src/tests/**/*',
      ],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', 'src/tests/**/*'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'coverage/',
    'src/generated/',
    '*.d.ts',
  ],
};

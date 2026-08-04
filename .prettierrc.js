/**
 * Prettier is the single source of truth for formatting. ESLint delegates all
 * stylistic decisions to it (via @react-native/eslint-config) so code review
 * can stay focused on behaviour rather than whitespace.
 */
module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: false,
  bracketSpacing: true,
  printWidth: 80,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
};

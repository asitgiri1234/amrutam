/**
 * lint-staged configuration.
 *
 * WHY this is a JS file rather than a `lint-staged` block in package.json:
 * ESLint 8 emits a *warning* when it is handed an explicit path it would
 * otherwise ignore, and our `--max-warnings=0` policy turns that warning into a
 * failed commit. Two categories of staged file hit that:
 *
 *   - `*.d.ts` — ambient declarations, excluded via `ignorePatterns`
 *   - dotfiles (`.eslintrc.js`, `.prettierrc.js`) — ESLint 8 ignores anything
 *     starting with `.` unless explicitly un-ignored
 *
 * A glob cannot express "everything except those", but a function can. Prettier
 * still formats them; only ESLint skips them.
 */

const path = require('path');

/** lint-staged passes absolute paths; quote them for paths containing spaces. */
const quote = files =>
  files.map(file => `"${path.relative(process.cwd(), file)}"`).join(' ');

const isLintable = file => {
  const base = path.basename(file);
  return !base.endsWith('.d.ts') && !base.startsWith('.');
};

module.exports = {
  '*.{ts,tsx,js,jsx}': files => {
    const tasks = [];
    const lintable = files.filter(isLintable);

    if (lintable.length > 0) {
      tasks.push(`eslint --fix --max-warnings=0 ${quote(lintable)}`);
    }

    tasks.push(`prettier --write ${quote(files)}`);
    return tasks;
  },
  '*.{json,md,yml,yaml}': files => [`prettier --write ${quote(files)}`],
};

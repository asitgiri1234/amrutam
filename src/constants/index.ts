/**
 * WHY `constants/` exists:
 *
 * Magic numbers and magic strings are the cheapest bug in the world to write
 * and one of the more expensive to find. This folder is where a value goes
 * when it is (a) referenced in more than one place, and (b) not an
 * environment-specific setting (those live in `config/`) or a design decision
 * (those live in `theme/`).
 *
 * Keeping those three separate matters: a designer can review `theme/`, a
 * release engineer can review `config/`, and neither has to read the other.
 */

export * from './app.constants';
export * from './layout.constants';
export * from './query.constants';

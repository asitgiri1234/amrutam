/**
 * WHY `tests/` exists as a source folder (and tests themselves live beside
 * their code):
 *
 * Test *files* are colocated — `Button.test.tsx` next to `Button.tsx` — so a
 * reviewer sees the test in the same diff as the change, and so deleting a
 * component deletes its test. That is not negotiable at team scale.
 *
 * What lives HERE is the test *infrastructure*: the provider wrapper, the
 * native-module mocks, factories for building fixtures. It is shared, it is
 * not colocated with anything, and it is the difference between "writing a
 * test costs 30 seconds" and "writing a test costs an hour of mocking".
 */

export {
  createTestQueryClient,
  renderWithProviders,
} from './renderWithProviders';
export type {
  RenderWithProvidersOptions,
  RenderWithProvidersResult,
} from './renderWithProviders';

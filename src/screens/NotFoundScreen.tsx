/**
 * Rendered when a deep link resolves to nothing.
 *
 * WHY it exists in the foundation: `linking.ts` maps `'*'` here, so a stale
 * marketing URL or a link to a feature the user's build does not have yet
 * lands on a real screen with a way back — rather than a blank view or a
 * navigation error.
 */

import { Screen } from '@components/Screen';
import { ErrorState } from '@design-system';
import type { RootStackScreenProps } from '@navigation/types';

export function NotFoundScreen({
  navigation,
  route,
}: RootStackScreenProps<'NotFound'>) {
  return (
    <Screen testID="not-found-screen">
      <ErrorState
        variant="notFound"
        description={
          route.params?.path === undefined
            ? 'That link did not lead anywhere.'
            : `We could not open “${route.params.path}”.`
        }
        retryLabel="Go home"
        onRetry={() => navigation.navigate('Main', { screen: 'Consultation' })}
      />
    </Screen>
  );
}

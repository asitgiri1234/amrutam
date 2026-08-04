/**
 * The root component.
 *
 * Deliberately tiny. Its only job is to compose the three layers — startup,
 * providers, navigation — in the right order. Every temptation to add
 * "just one more thing" here has a proper home:
 *
 *   a provider              -> providers/AppProviders.tsx
 *   startup side effects    -> app/bootstrap.ts
 *   a route                 -> navigation/
 *
 * Keeping it this small is what makes the composition auditable at a glance.
 */

import { useEffect } from 'react';

import { RootNavigator } from '@navigation/RootNavigator';
import { AppProviders } from '@providers/AppProviders';

import { bootstrap, runDeferredStartupTasks } from './bootstrap';

// Runs at import time, before React renders the first frame — see bootstrap.ts.
bootstrap();

function App() {
  useEffect(() => {
    runDeferredStartupTasks();
  }, []);

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

// Default export required by `AppRegistry.registerComponent` in index.js.

export default App;

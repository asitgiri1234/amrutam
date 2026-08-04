/**
 * Pre-React startup.
 *
 * WHY a module executed at import time rather than an effect in App:
 * several things must be in place *before* the first render, and an effect
 * runs after it:
 *
 *   - the global error handler, or a crash during initial render is untracked
 *   - the connectivity listener, so the first query knows whether it is online
 *   - the queue processor, so writes made in a previous session start
 *     replaying immediately rather than after the user reaches a screen
 *
 * Everything here must be synchronous and cheap. Work that can wait belongs in
 * `runDeferredStartupTasks`, which runs after the first frame — startup time is
 * the metric users feel most and the easiest one to quietly regress.
 */

import { InteractionManager } from 'react-native';

import { APP_ENV } from '@config';
import { cacheManager } from '@offline/cacheManager';
import { startConnectivityListener } from '@offline/connectivityListener';
import { syncManager } from '@offline/syncManager';
import { queueProcessor } from '@queue/queueProcessor';
import { installGlobalErrorHandlers } from '@services/errorReporting.service';
import { logger } from '@utils/logger';

const log = logger.scoped('bootstrap');

let started = false;

/** Idempotent — Fast Refresh re-runs module scope. */
export function bootstrap(): void {
  if (started) {
    return;
  }
  started = true;

  installGlobalErrorHandlers();
  startConnectivityListener();

  // `offline/` must not import `queue/` (they are independent boundaries), so
  // the composition happens here, at the one layer allowed to know about both.
  syncManager.setQueueDrainer(() => queueProcessor.drain());
  queueProcessor.start();

  log.info('bootstrap complete', { env: APP_ENV });
}

/**
 * Non-critical startup work, deferred until after the first interaction so it
 * cannot delay time-to-interactive.
 */
export function runDeferredStartupTasks(): void {
  InteractionManager.runAfterInteractions(() => {
    cacheManager.prune();
    void syncManager.sync('coldStart');
  });
}

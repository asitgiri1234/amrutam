/**
 * WHY `app/` exists:
 *
 * It is the *composition root* — the one layer allowed to know about every
 * other layer, and therefore the one place where cross-layer wiring lives
 * (e.g. handing the queue's drain function to the sync manager, which must not
 * import it directly).
 *
 * Everything else in `src/` points downward and knows nothing about the app as
 * a whole. That asymmetry is what keeps the dependency graph a DAG: there is
 * exactly one node with permission to depend on everything, and it contains
 * roughly forty lines of code.
 */

export { bootstrap, runDeferredStartupTasks } from './bootstrap';

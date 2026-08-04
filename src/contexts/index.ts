/**
 * WHY `contexts/` is separate from `providers/`:
 *
 * A React context has two halves — the *contract* (`createContext` + the value
 * type) and the *implementation* (the component that computes and supplies the
 * value).
 *
 * Keeping contracts in their own dependency-light modules means a consumer
 * (`useTheme`, `useToast`) imports only a type and a context handle. If the
 * consumer imported the provider instead, every unit test that renders a
 * Button would transitively pull in MMKV, the Appearance listener and a timer
 * queue — turning a 5ms test into a 500ms one, and requiring native mocks for
 * a component that renders a rectangle.
 *
 * It also makes circular imports structurally impossible: providers depend on
 * contexts, never the reverse.
 */

export { ThemeContext } from './ThemeContext';
export type { ThemeContextValue } from './ThemeContext';

export { ToastContext } from './ToastContext';
export type { ToastContextValue } from './ToastContext';

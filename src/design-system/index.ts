/**
 * WHY `design-system/` exists (and why it is separate from `components/`):
 *
 * These are the *primitives* — the vocabulary every screen is built from. They
 * have three hard rules that ordinary components do not:
 *
 *   1. **No business knowledge.** A Button does not know what a consultation
 *      is. That is what makes it reusable across four product areas.
 *   2. **No data fetching.** Primitives take props and render. Anything that
 *      calls the network belongs in `components/` or a module.
 *   3. **Theme-driven, always.** Every colour, size and radius comes from the
 *      theme, so light/dark is automatic and a rebrand touches no component.
 *
 * The payoff for a team: a new engineer building the Shop screen does not make
 * a single visual decision, and the Shop screen automatically looks like the
 * Consultation screen built by someone else last month.
 *
 * `components/` is the next layer up: app-specific compositions of these that
 * may know about app concepts (a Screen wrapper, an ErrorBoundary).
 */

export { Avatar } from './components/Avatar';
export type { AvatarProps, AvatarSize } from './components/Avatar';

export { Button } from './components/Button';
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from './components/Button';

export { Card } from './components/Card';
export type { CardPadding, CardProps, CardVariant } from './components/Card';

export { Divider, ListDivider } from './components/Divider';
export type { DividerProps } from './components/Divider';

export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';

export { ErrorState } from './components/ErrorState';
export type {
  ErrorStateProps,
  ErrorStateVariant,
} from './components/ErrorState';

export { FilterChip } from './components/FilterChip';
export type { FilterChipProps } from './components/FilterChip';

export { Icon } from './components/Icon';
export type { IconName, IconProps } from './components/Icon';

export { Loader } from './components/Loader';
export type { LoaderProps } from './components/Loader';

export { Modal } from './components/Modal';
export type { ModalPresentation, ModalProps } from './components/Modal';

export { Screen } from './components/Screen';
export type { ScreenProps } from './components/Screen';

export { SearchBar } from './components/SearchBar';
export type { SearchBarProps } from './components/SearchBar';

export { Skeleton, SkeletonListItem } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';

export { TextField } from './components/TextField';
export type { TextFieldProps } from './components/TextField';

export { Toast } from './components/Toast';
export type {
  ToastAction,
  ToastItem,
  ToastOptions,
  ToastProps,
  ToastVariant,
} from './components/Toast';

export { Text, Typography } from './components/Typography';
export type { TextTone, TypographyProps } from './components/Typography';

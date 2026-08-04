/**
 * Ambient declarations.
 *
 * `process.env` is not a real object in a React Native bundle — Babel's
 * `transform-inline-environment-variables` plugin replaces each read with a
 * string literal at build time (see babel.config.js). Declaring it narrowly
 * here gives `config/index.ts` a type without pulling in all of `@types/node`,
 * which would wrongly make Node globals (`Buffer`, `fs`, `setImmediate`) look
 * available to app code.
 */

declare const process: {
  readonly env: {
    readonly APP_ENV?: 'development' | 'staging' | 'production';
    readonly NODE_ENV?: 'development' | 'production' | 'test';
  };
};

/** React Native's dev-mode global. */
declare const __DEV__: boolean;

/** SVG files imported as React components once `svgr` is wired up. */
declare module '*.svg' {
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}

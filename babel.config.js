/**
 * Babel configuration.
 *
 * Order of plugins matters a great deal here:
 *  1. `transform-inline-environment-variables` inlines APP_ENV at build time so
 *     the config module resolves to a single environment with no runtime lookup.
 *  2. `module-resolver` powers the absolute-import aliases (must run before any
 *     plugin that inspects import paths).
 *  3. `react-native-worklets/plugin` MUST be listed last — Reanimated 4 moved its
 *     worklet transform into the worklets package and it has to see the final AST.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'transform-inline-environment-variables',
      {
        include: ['APP_ENV'],
      },
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@api': './src/api',
          '@assets': './src/assets',
          '@components': './src/components',
          '@config': './src/config',
          '@constants': './src/constants',
          '@contexts': './src/contexts',
          '@design-system': './src/design-system',
          '@generated': './src/generated',
          '@hooks': './src/hooks',
          '@mocks': './src/mocks',
          '@models': './src/models',
          '@modules': './src/modules',
          '@navigation': './src/navigation',
          '@offline': './src/offline',
          '@providers': './src/providers',
          '@queue': './src/queue',
          '@repositories': './src/repositories',
          '@screens': './src/screens',
          '@services': './src/services',
          '@storage': './src/storage',
          '@store': './src/store',
          '@app-types': './src/types',
          '@tests': './src/tests',
          '@theme': './src/theme',
          '@utils': './src/utils',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};

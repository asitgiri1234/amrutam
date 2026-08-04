/**
 * Application entry point.
 *
 * `react-native-gesture-handler` must be the very first import in the bundle so
 * its native event coalescing is installed before any view is mounted. Anything
 * that needs to run before React (crash reporting, global error handler) is
 * wired up inside `src/app/bootstrap.ts`, which App imports at module scope.
 *
 * @format
 */

import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import App from './src/app/App';

AppRegistry.registerComponent(appName, () => App);

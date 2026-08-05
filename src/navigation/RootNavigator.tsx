/**
 * RootNavigator — the container plus the top-level stack.
 *
 * WHY a root stack wrapping the tabs, rather than tabs at the root:
 *   - modals, checkout and a video consultation must cover the tab bar
 *   - the auth flow replaces the whole shell, not one tab
 *   - deep links resolve against one root, which keeps `linking.ts` coherent
 *
 * The container also owns two app-wide concerns that have nowhere better to
 * live: screen-change analytics, and syncing React Navigation's theme with
 * ours so headers and screen backgrounds change with the theme for free.
 */

import { useCallback, useRef } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DesignSystemScreen } from '@screens/DesignSystemScreen';
import { NotFoundScreen } from '@screens/NotFoundScreen';
import { toNavigationTheme, useTheme } from '@theme';
import { logger } from '@utils/logger';

import { linking } from './linking';
import { MainTabNavigator } from './MainTabNavigator';
import { getCurrentRouteName, navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';

const log = logger.scoped('navigation');

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const previousRouteName = useRef<string | undefined>(undefined);

  const handleReady = useCallback(() => {
    previousRouteName.current = getCurrentRouteName();
  }, []);

  const handleStateChange = useCallback(() => {
    const current = getCurrentRouteName();

    if (current !== undefined && current !== previousRouteName.current) {
      // Single funnel for screen-view analytics. When the analytics service
      // lands it subscribes here rather than every screen calling it on mount.
      log.debug('screen', { from: previousRouteName.current, to: current });
      previousRouteName.current = current;
    }
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={toNavigationTheme(theme)}
      linking={linking}
      onReady={handleReady}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          // The native driver gives us platform-correct transitions for free
          // and keeps them off the JS thread.
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="DesignSystem"
          component={DesignSystemScreen}
          options={{ headerShown: true, title: 'Design system' }}
        />
        <Stack.Screen
          name="NotFound"
          component={NotFoundScreen}
          options={{ headerShown: true, title: 'Not found' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

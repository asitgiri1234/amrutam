/**
 * MainTabNavigator — the four product areas.
 *
 * WHY bottom tabs and not a drawer: the four areas are peers a user switches
 * between constantly (browse a product, check a prescription, message a
 * doctor). Tabs make all four one thumb-tap away and keep each one's
 * navigation state alive; a drawer hides them behind a gesture and is measurably
 * worse for discovery.
 *
 * Each tab will host its OWN native stack once modules land. That nesting is
 * what preserves per-tab back history — switching tabs must not reset where
 * the user was, and a single shared stack cannot do that.
 *
 * Tab bar styling comes entirely from the theme, so dark mode needs no work
 * here.
 */

import { BORDER_WIDTH } from '@constants/layout.constants';
import { Icon, type IconName } from '@design-system';
import { DoctorListScreen } from '@modules/consultation';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HealthRecordsScreen } from '@screens/HealthRecordsScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { ShopScreen } from '@screens/ShopScreen';
import { useTheme } from '@theme';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, IconName> = {
  Consultation: 'consultation',
  Shop: 'shop',
  HealthRecords: 'health',
  Settings: 'settings',
};

export function MainTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: BORDER_WIDTH.thin,
        },
        headerTitleStyle: {
          ...theme.typography.variants.h4,
          color: theme.colors.text,
        },
        headerTintColor: theme.colors.text,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
          borderTopWidth: BORDER_WIDTH.thin,
        },
        tabBarLabelStyle: theme.typography.variants.caption,
        tabBarIcon: ({ color, focused }) => (
          <Icon
            name={TAB_ICONS[route.name]}
            size="lg"
            color={color}
            // A slightly heavier stroke reads as "selected" without needing a
            // second filled icon set.
            strokeWidth={focused ? 2.4 : 1.8}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Consultation"
        component={DoctorListScreen}
        options={{ title: 'Consult' }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{ title: 'Shop' }}
      />
      <Tab.Screen
        name="HealthRecords"
        component={HealthRecordsScreen}
        options={{ title: 'Records' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

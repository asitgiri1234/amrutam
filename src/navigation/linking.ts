/**
 * Deep-link configuration.
 *
 * WHY it is defined now, before any module needs it: retrofitting deep links
 * means renaming routes that are already live in emails and push
 * notifications. Establishing the URL shape alongside the route names — and
 * keeping them in one file — makes every module that lands afterwards
 * automatically linkable.
 *
 * Modules extend `config.screens` when they add nested stacks; they do not
 * create a second linking config.
 */

import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['amrutam://', 'https://amrutam.com', 'https://www.amrutam.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Consultation: 'consult',
          Shop: 'shop',
          HealthRecords: 'records',
          Settings: 'settings',
        },
      },
      NotFound: '*',
    },
  },
};

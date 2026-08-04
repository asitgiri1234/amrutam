/**
 * SearchBar — debounced search input.
 *
 * WHY the debounce lives *inside* the component: search is the single most
 * common place a team accidentally ships one network request per keystroke.
 * Making the debounced callback the primary API (`onSearch`) and the raw one
 * secondary (`onChangeText`) means the cheap thing is also the default thing.
 *
 * The input stays fully controlled locally so typing is never laggy — only the
 * *notification* downstream is debounced, never the rendered value.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { SEARCH_DEBOUNCE_MS } from '@constants/app.constants';
import { BORDER_WIDTH, MIN_TOUCH_TARGET } from '@constants/layout.constants';
import { useTheme, type Theme } from '@theme';
import { debounce } from '@utils/debounce';

import { Icon } from './Icon';

export interface SearchBarProps {
  /** Fires after the user stops typing for `debounceMs`. */
  onSearch: (query: string) => void;
  placeholder?: string;
  /** Fires on every keystroke. Use only for local filtering. */
  onChangeText?: (query: string) => void;
  initialValue?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  /** Renders a filter affordance on the trailing edge. */
  onFilterPress?: () => void;
  filterActive?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search',
  onChangeText,
  initialValue = '',
  debounceMs = SEARCH_DEBOUNCE_MS,
  autoFocus = false,
  onFilterPress,
  filterActive = false,
  style,
  testID = 'search-bar',
}: SearchBarProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState(initialValue);

  // `onSearch` identity is rarely stable at call sites, so read it through a
  // ref. Rebuilding the debouncer on every render would defeat the debounce.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        onSearchRef.current(query);
      }, debounceMs),
    [debounceMs],
  );

  // A pending search must not fire into an unmounted screen.
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      onChangeText?.(next);
      debouncedSearch(next);
    },
    [debouncedSearch, onChangeText],
  );

  const handleClear = useCallback(() => {
    setValue('');
    onChangeText?.('');
    debouncedSearch.cancel();
    onSearchRef.current('');
    inputRef.current?.focus();
  }, [debouncedSearch, onChangeText]);

  return (
    <View style={[styles.row, style]}>
      <View style={styles.field}>
        <Icon name="search" size="md" color={theme.colors.textTertiary} />

        <TextInput
          ref={inputRef}
          testID={testID}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          selectionColor={theme.colors.primary}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
          accessibilityRole="search"
          accessibilityLabel={placeholder}
          onSubmitEditing={() => {
            debouncedSearch.flush();
          }}
          style={styles.input}
        />

        {value.length === 0 ? null : (
          <Pressable
            onPress={handleClear}
            hitSlop={theme.spacing.sm}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            testID="search-clear"
          >
            <Icon name="close" size="sm" color={theme.colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {onFilterPress === undefined ? null : (
        <Pressable
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          accessibilityState={{ selected: filterActive }}
          testID="search-filter"
          style={[
            styles.filterButton,
            {
              backgroundColor: filterActive
                ? theme.colors.primaryMuted
                : theme.colors.surface,
              borderColor: filterActive
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          <Icon
            name="filter"
            size="md"
            color={
              filterActive ? theme.colors.primary : theme.colors.textSecondary
            }
          />
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    field: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceSunken,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      borderWidth: BORDER_WIDTH.thin,
      columnGap: theme.spacing.sm,
      flex: 1,
      flexDirection: 'row',
      minHeight: MIN_TOUCH_TARGET,
      paddingHorizontal: theme.spacing.lg,
    },
    filterButton: {
      alignItems: 'center',
      borderRadius: theme.radius.pill,
      borderWidth: BORDER_WIDTH.thin,
      height: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      width: MIN_TOUCH_TARGET,
    },
    input: {
      ...theme.typography.variants.bodyLarge,
      color: theme.colors.text,
      flex: 1,
      paddingVertical: theme.spacing.sm,
    },
    row: {
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
    },
  });

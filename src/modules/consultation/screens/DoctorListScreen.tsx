/**
 * Doctor listing.
 *
 * Scope: browsing only. No booking flow, no detail screen — tapping a card is
 * wired to a no-op handler that the next milestone replaces with navigation.
 *
 * THE FOUR STATES, all handled explicitly because a list that only handles the
 * happy path is the most common half-finished screen in any app:
 *
 *   loading  — skeleton rows, not a spinner: the shape is known, so showing it
 *              makes the wait feel shorter and stops the layout jumping.
 *   error    — `ErrorState` with retry, and an offline-specific variant so a
 *              user with no signal is not told "something went wrong".
 *   empty    — distinguishes "no results for these filters" (offer a reset)
 *              from "nothing at all", which are different problems.
 *   success  — the list.
 *
 * SCROLL PERFORMANCE with 5,000 rows:
 *   - FlashList v2 recycles rows; `DoctorCard` is memoised on doctor id so a
 *     recycle does not force a re-render.
 *   - `renderItem`, `keyExtractor` and the press handler are all `useCallback`
 *     -stable, so the memo actually holds. An inline arrow here would defeat
 *     every optimisation in the card.
 *   - Only ~20 rows are in memory per page; paging is what keeps this bounded
 *     regardless of how large the result set is.
 */

import { useCallback, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import {
  Button,
  EmptyState,
  ErrorState,
  FilterChip,
  Screen,
  SearchBar,
  SkeletonListItem,
  Typography,
} from '@design-system';
import { useIsOnline } from '@hooks/useNetworkStatus';
import { SPECIALITIES, type Doctor, type Speciality } from '@models';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import {
  hasActiveFilters,
  useConsultationStore,
} from '@store/consultation.store';
import { useThemedStyles, type Theme } from '@theme';

import { DoctorCard } from '../components/DoctorCard';
import { DoctorFilterSheet } from '../components/DoctorFilterSheet';
import { useDoctorList } from '../hooks/useDoctorList';

const SKELETON_ROWS = 8;

export function DoctorListScreen() {
  const styles = useThemedStyles(createStyles);
  const isOnline = useIsOnline();
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);

  // Selector-scoped subscriptions: the screen re-renders when filters change,
  // not when any unrelated slice of the store does.
  const filters = useConsultationStore(state => state.filters);
  const setQuery = useConsultationStore(state => state.setQuery);
  const toggleSpeciality = useConsultationStore(
    state => state.toggleSpeciality,
  );
  const setExperience = useConsultationStore(state => state.setExperience);
  const setMaxFee = useConsultationStore(state => state.setMaxFee);
  const setAcceptingPatientsOnly = useConsultationStore(
    state => state.setAcceptingPatientsOnly,
  );
  const resetFilters = useConsultationStore(state => state.resetFilters);

  const {
    doctors,
    totalCount,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage,
    error,
    loadNextPage,
    refresh,
    retry,
  } = useDoctorList(filters);

  const filtersActive = hasActiveFilters(filters);

  /* ---- Stable callbacks. Every one of these exists so `DoctorCard`'s memo
   * is not defeated by a new function identity on each render. ------------ */

  const handleDoctorPress = useCallback((_doctorId: string) => {
    // Intentionally inert: the detail screen is the next milestone. Wired now
    // so the prop identity — and therefore the memo — is already correct.
  }, []);

  const renderItem: ListRenderItem<Doctor> = useCallback(
    ({ item }) => <DoctorCard doctor={item} onPress={handleDoctorPress} />,
    [handleDoctorPress],
  );

  const keyExtractor = useCallback((item: Doctor) => item.id, []);

  const openFilters = useCallback(() => setFilterSheetOpen(true), []);
  const closeFilters = useCallback(() => setFilterSheetOpen(false), []);

  const renderFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.footer}>
          <SkeletonListItem />
        </View>
      ) : null,
    [isFetchingNextPage, styles.footer],
  );

  /* ---- Header: search + speciality rail + result count ------------------ */

  const header = (
    <View style={styles.header}>
      <SearchBar
        onSearch={setQuery}
        initialValue={filters.query}
        placeholder="Search doctors, specialities"
        onFilterPress={openFilters}
        filterActive={filtersActive}
        testID="doctor-search"
      />

      <View style={styles.specialityRail}>
        {SPECIALITIES.map((speciality: Speciality) => (
          <FilterChip
            key={speciality}
            label={speciality}
            selected={filters.specialities.includes(speciality)}
            onPress={() => toggleSpeciality(speciality)}
            testID={`speciality-${speciality}`}
          />
        ))}
      </View>

      {isLoading ? null : (
        <Typography variant="caption" tone="tertiary">
          {totalCount === 1 ? '1 doctor' : `${totalCount} doctors`}
        </Typography>
      )}
    </View>
  );

  /* ---- Body ------------------------------------------------------------- */

  const renderBody = () => {
    // An error with nothing already on screen is fatal to the view; an error
    // while paging is not, and must not blow away rows the user is reading.
    if (error !== null && doctors.length === 0) {
      return (
        <ErrorState
          variant={isOnline ? 'generic' : 'offline'}
          onRetry={retry}
          testID="doctor-list-error"
        />
      );
    }

    if (isLoading) {
      return (
        <View testID="doctor-list-loading">
          {Array.from({ length: SKELETON_ROWS }, (_unused, index) => (
            <SkeletonListItem key={index} />
          ))}
        </View>
      );
    }

    if (doctors.length === 0) {
      return filtersActive ? (
        <EmptyState
          icon="filter"
          title="No doctors match those filters"
          description="Try widening your search or clearing a filter."
          actionLabel="Clear filters"
          onAction={resetFilters}
          testID="doctor-list-empty-filtered"
        />
      ) : (
        <EmptyState
          icon="consultation"
          title="No doctors available"
          description="Please check back shortly."
          testID="doctor-list-empty"
        />
      );
    }

    return (
      <FlashList
        data={doctors}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={loadNextPage}
        // 0.5 rather than the default: at 20 rows per page a fast scroller
        // outruns a later trigger and sees the footer skeleton every time.
        onEndReachedThreshold={0.5}
        onRefresh={refresh}
        refreshing={isRefreshing}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        testID="doctor-list"
      />
    );
  };

  return (
    <Screen padded={false} testID="doctor-list-screen">
      <View style={styles.headerContainer}>{header}</View>

      <View style={styles.listContainer}>{renderBody()}</View>

      {/* Rendered unconditionally so its open/close animates rather than
          popping in from nothing. */}
      <DoctorFilterSheet
        visible={isFilterSheetOpen}
        onClose={closeFilters}
        experience={filters.experience}
        onExperienceChange={setExperience}
        maxFeeMinor={filters.maxFeeMinor}
        onMaxFeeChange={setMaxFee}
        acceptingPatientsOnly={filters.acceptingPatientsOnly}
        onAcceptingPatientsChange={setAcceptingPatientsOnly}
        onReset={resetFilters}
        resultCount={totalCount}
      />

      {/* A paging failure keeps the loaded rows and offers a retry inline,
          rather than replacing the list with an error screen. */}
      {error !== null && doctors.length > 0 ? (
        <View style={styles.inlineError}>
          <Typography variant="caption" tone="danger">
            Could not load more.
          </Typography>
          <Button
            label="Retry"
            size="sm"
            variant="ghost"
            onPress={loadNextPage}
            testID="doctor-list-page-retry"
          />
        </View>
      ) : null}

      {!hasNextPage && doctors.length > 0 ? (
        <View style={styles.endOfList}>
          <Typography variant="caption" tone="tertiary">
            End of results
          </Typography>
        </View>
      ) : null}
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    endOfList: {
      alignItems: 'center',
      paddingBottom: theme.spacing.sm,
    },
    footer: {
      paddingVertical: theme.spacing.sm,
    },
    header: {
      rowGap: theme.spacing.md,
    },
    headerContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
    },
    inlineError: {
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xs,
    },
    listContainer: {
      flex: 1,
      marginTop: theme.spacing.md,
    },
    listContent: {
      paddingBottom: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.lg,
    },
    specialityRail: {
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: theme.spacing.sm,
    },
  });

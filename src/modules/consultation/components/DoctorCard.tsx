/**
 * A single doctor row.
 *
 * PERFORMANCE NOTES — this is the component that decides whether 5,000 rows
 * scroll at 60fps, so the choices here are deliberate:
 *
 *   - **`memo` with a custom comparator.** FlashList recycles rows: as you
 *     scroll, the same component instance is handed a different `doctor`. The
 *     default shallow compare would re-render on every recycle because the
 *     object identity always differs. Comparing by `id` means a recycled row
 *     re-renders only when it is genuinely showing a different doctor.
 *   - **No inline closures in the parent.** `onPress` is passed the doctor id
 *     rather than a bound lambda, so the prop identity is stable across
 *     renders and the memo actually holds.
 *   - **Derived strings computed once per doctor**, not per render.
 *   - **Fixed row height.** Predictable heights let FlashList size its window
 *     without measuring, which is the single biggest scroll-jank lever.
 */

import { memo, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { Avatar, Card, Icon, Typography } from '@design-system';
import type { Doctor } from '@models';
import { useThemedStyles, type Theme } from '@theme';
import { formatCompactNumber, formatCurrency } from '@utils/formatter';

/** Rows are a fixed height so FlashList never has to measure. */
export const DOCTOR_CARD_HEIGHT = 132;

export interface DoctorCardProps {
  doctor: Doctor;
  /** Receives the id, not a closure — see the note above. */
  onPress?: (doctorId: string) => void;
}

function DoctorCardComponent({ doctor, onPress }: DoctorCardProps) {
  const styles = useThemedStyles(createStyles);

  const { specialityLine, feeLabel, reviewLabel } = useMemo(() => {
    const [primary, ...rest] = doctor.specialities;

    return {
      specialityLine:
        rest.length > 0
          ? `${primary ?? ''} +${rest.length}`
          : primary ?? 'General practice',
      // Cheapest offered mode — what a price-sensitive user compares on.
      feeLabel: (() => {
        const amounts = Object.values(doctor.fees).map(fee => fee.amountMinor);
        return amounts.length === 0
          ? null
          : formatCurrency(Math.min(...amounts), { compactDecimals: true });
      })(),
      reviewLabel: formatCompactNumber(doctor.rating.count),
    };
  }, [doctor]);

  const handlePress = useMemo(
    () => (onPress === undefined ? undefined : () => onPress(doctor.id)),
    [doctor.id, onPress],
  );

  return (
    <Card
      variant="outlined"
      padding="md"
      style={styles.card}
      onPress={handlePress}
      accessibilityLabel={`${doctor.fullName}, ${specialityLine}`}
      testID={`doctor-card-${doctor.id}`}
    >
      <View style={styles.row}>
        <Avatar
          uri={doctor.photoUrl}
          name={doctor.fullName}
          size="lg"
          status={doctor.isAcceptingPatients ? 'online' : 'offline'}
        />

        <View style={styles.body}>
          <Typography variant="label" numberOfLines={1}>
            {doctor.fullName}
          </Typography>

          <Typography variant="bodySmall" tone="secondary" numberOfLines={1}>
            {specialityLine}
          </Typography>

          <Typography variant="caption" tone="tertiary" numberOfLines={1}>
            {`${doctor.experienceYears} yrs exp · ${
              doctor.clinic?.city ?? 'Online'
            }`}
          </Typography>

          <View style={styles.metaRow}>
            <Icon name="check" size="xs" color={styles.ratingIcon.color} />
            <Typography variant="caption" tone="secondary">
              {`${doctor.rating.average} (${reviewLabel})`}
            </Typography>

            {feeLabel === null ? null : (
              <Typography variant="caption" tone="primary">
                {`from ${feeLabel}`}
              </Typography>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

/**
 * Custom comparator — see the header note. Only an actual change of doctor (or
 * of the press handler) should cost a render.
 */
export const DoctorCard = memo(
  DoctorCardComponent,
  (previous, next) =>
    previous.doctor.id === next.doctor.id && previous.onPress === next.onPress,
);

DoctorCard.displayName = 'DoctorCard';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    body: {
      flex: 1,
      justifyContent: 'center',
      rowGap: theme.spacing.xxs,
    },
    card: {
      height: DOCTOR_CARD_HEIGHT - theme.spacing.md,
      justifyContent: 'center',
    },
    metaRow: {
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      marginTop: theme.spacing.xxs,
    },
    ratingIcon: {
      color: theme.colors.success,
    },
    row: {
      alignItems: 'center',
      columnGap: theme.spacing.md,
      flexDirection: 'row',
    },
  });

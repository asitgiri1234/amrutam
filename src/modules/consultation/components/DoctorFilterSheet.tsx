/**
 * Experience and fee filters, in a sheet.
 *
 * WHY these two are in a sheet while speciality is inline: speciality is the
 * filter people reach for constantly and it reads well as a horizontal chip
 * rail. Experience and fee are refinements — putting all three inline would
 * push the actual list below the fold on a small phone, which is the most
 * common way a filter UI makes a list worse.
 *
 * Both are single-select: "under ₹500" and "under ₹1000" are not meaningfully
 * combinable, and neither are overlapping experience brackets. Modelling them
 * as radio-style avoids a state where the user has selected a contradiction.
 */

import { memo, useCallback } from 'react';

import { StyleSheet, View } from 'react-native';

import { Button, FilterChip, Modal, Typography } from '@design-system';
import {
  FEE_CEILINGS_MINOR,
  type ExperienceBracket,
  type FeeCeilingMinor,
} from '@store/consultation.store';
import { useThemedStyles, type Theme } from '@theme';
import { formatCurrency } from '@utils/formatter';

const EXPERIENCE_OPTIONS: Array<{
  value: ExperienceBracket;
  label: string;
}> = [
  { value: '0-5', label: 'Up to 5 yrs' },
  { value: '5-10', label: '5–10 yrs' },
  { value: '10-20', label: '10–20 yrs' },
  { value: '20+', label: '20+ yrs' },
];

export interface DoctorFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  experience: ExperienceBracket | null;
  onExperienceChange: (value: ExperienceBracket | null) => void;
  maxFeeMinor: FeeCeilingMinor | null;
  onMaxFeeChange: (value: FeeCeilingMinor | null) => void;
  acceptingPatientsOnly: boolean;
  onAcceptingPatientsChange: (value: boolean) => void;
  onReset: () => void;
  /** Live count so the user sees the effect before dismissing. */
  resultCount: number;
}

function DoctorFilterSheetComponent({
  visible,
  onClose,
  experience,
  onExperienceChange,
  maxFeeMinor,
  onMaxFeeChange,
  acceptingPatientsOnly,
  onAcceptingPatientsChange,
  onReset,
  resultCount,
}: DoctorFilterSheetProps) {
  const styles = useThemedStyles(createStyles);

  // Tapping the selected option clears it — a radio group with no escape
  // hatch strands the user with a filter they cannot remove.
  const handleExperience = useCallback(
    (value: ExperienceBracket) => {
      onExperienceChange(experience === value ? null : value);
    },
    [experience, onExperienceChange],
  );

  const handleFee = useCallback(
    (value: FeeCeilingMinor) => {
      onMaxFeeChange(maxFeeMinor === value ? null : value);
    },
    [maxFeeMinor, onMaxFeeChange],
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Filters"
      testID="doctor-filter-sheet"
      footer={
        <View style={styles.footer}>
          <Button
            label="Reset"
            variant="ghost"
            onPress={onReset}
            testID="filter-reset"
          />
          <Button
            label={`Show ${resultCount}`}
            onPress={onClose}
            style={styles.apply}
            testID="filter-apply"
          />
        </View>
      }
    >
      <View style={styles.section}>
        <Typography variant="overline" tone="tertiary">
          Experience
        </Typography>
        <View style={styles.chips}>
          {EXPERIENCE_OPTIONS.map(option => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={experience === option.value}
              onPress={() => handleExperience(option.value)}
              testID={`filter-experience-${option.value}`}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="overline" tone="tertiary">
          Consultation fee
        </Typography>
        <View style={styles.chips}>
          {FEE_CEILINGS_MINOR.map(ceiling => (
            <FilterChip
              key={ceiling}
              label={`Under ${formatCurrency(ceiling, {
                compactDecimals: true,
              })}`}
              selected={maxFeeMinor === ceiling}
              onPress={() => handleFee(ceiling)}
              testID={`filter-fee-${ceiling}`}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="overline" tone="tertiary">
          Availability
        </Typography>
        <View style={styles.chips}>
          <FilterChip
            label="Accepting new patients"
            selected={acceptingPatientsOnly}
            onPress={() => onAcceptingPatientsChange(!acceptingPatientsOnly)}
            testID="filter-accepting"
          />
        </View>
      </View>
    </Modal>
  );
}

export const DoctorFilterSheet = memo(DoctorFilterSheetComponent);
DoctorFilterSheet.displayName = 'DoctorFilterSheet';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    apply: {
      flex: 1,
    },
    chips: {
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
      rowGap: theme.spacing.sm,
    },
    footer: {
      alignItems: 'center',
      columnGap: theme.spacing.md,
      flexDirection: 'row',
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
  });

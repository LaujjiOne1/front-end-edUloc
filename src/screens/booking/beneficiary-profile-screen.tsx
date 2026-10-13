import { type Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion/fade-in";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { SelectField, type SelectOption } from "@/components/ui/select-field";
import { StepProgress } from "@/components/ui/step-progress";
import { BeneficiaryService, BeneficiaryServiceError } from "@/services/beneficiary.service";
import { useBookingWizardStore } from "@/store/booking-wizard.store";
import { useSearchWizardStore } from "@/store/search-wizard.store";
import type { DifficultyId } from "@/types/beneficiary";

const BOOKING_SUMMARY_ROUTE = "/booking-summary" as Href;

// The spec doesn't define French labels for DifficultyId — a direct mapping
// of the real enum values, flagged rather than invented (AGENTS.md §11).
const DIFFICULTY_OPTIONS: (SelectOption & { id: DifficultyId })[] = [
  { id: "theoretical", label: "Compréhension théorique" },
  { id: "practical", label: "Mise en pratique / exercices" },
  { id: "methodological", label: "Méthode de travail" },
  { id: "confidence", label: "Confiance en soi" },
  { id: "other", label: "Autre" },
];

export function BeneficiaryProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const offer = useBookingWizardStore((s) => s.offer);
  const beneficiary = useBookingWizardStore((s) => s.beneficiary);
  const difficulty = useBookingWizardStore((s) => s.difficulty);
  const setDifficulty = useBookingWizardStore((s) => s.setDifficulty);
  const subject = useSearchWizardStore((s) => s.criteria.subject);
  const objective = useSearchWizardStore((s) => s.criteria.objective);
  const [isNavigating, setIsNavigating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  // Guard: this recap needs both an active booking and a chosen beneficiary,
  // i.e. Beneficiary (step 1/3) must have been completed first.
  const hasContext = !!offer && !!beneficiary;

  useEffect(() => {
    if (!hasContext) router.replace("/home");
  }, [hasContext, router]);

  // Default the field to whatever difficulty is already saved on this beneficiary.
  useEffect(() => {
    if (!difficulty && beneficiary?.difficulty) setDifficulty(beneficiary.difficulty);
  }, [difficulty, beneficiary, setDifficulty]);

  if (!hasContext || !beneficiary) return null;

  const selectedDifficulty = DIFFICULTY_OPTIONS.find((d) => d.id === difficulty) ?? null;

  const continueToSummary = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setSaveError(null);
    if (difficulty && difficulty !== beneficiary.difficulty) {
      try {
        await BeneficiaryService.updateBeneficiary(beneficiary.id, { difficulty: difficulty as DifficultyId });
      } catch (error) {
        setSaveError(
          error instanceof BeneficiaryServiceError ? error.message : "Impossible d'enregistrer la difficulté.",
        );
        setIsNavigating(false);
        return;
      }
    }
    router.push(BOOKING_SUMMARY_ROUTE);
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={2} total={3} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">
            À propos de {beneficiary.isSelf ? "vous" : beneficiary.firstName}
          </Text>
          <Text className="mb-5 text-[13.5px] text-ink-soft">
            {beneficiary.isSelf ? "Votre profil pédagogique" : "Son profil pédagogique"}
          </Text>
        </FadeIn>

        <FadeIn delay={90}>
          <View className="mb-3 rounded-lg border border-line bg-surface p-4">
            <SummaryRow label="Niveau" value={beneficiary.level?.label ?? "—"} />
            <View className="h-px bg-line-soft" />
            <SummaryRow label="Matière" value={subject?.label ?? "—"} />
            <View className="h-px bg-line-soft" />
            <SummaryRow label="Objectif" value={objective?.label ?? "—"} />
          </View>
        </FadeIn>

        <FadeIn delay={130}>
          <SelectField
            label="Difficulté principale"
            value={selectedDifficulty}
            options={DIFFICULTY_OPTIONS}
            onSelect={(option) => setDifficulty(option.id)}
          />
          {saveError ? <FormError message={saveError} /> : null}
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button label="Continuer" loading={isNavigating} disabled={isNavigating} onPress={continueToSummary} />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-[14px] text-ink-soft">{label}</Text>
      <Text className="text-[14px] font-bold text-ink">{value}</Text>
    </View>
  );
}

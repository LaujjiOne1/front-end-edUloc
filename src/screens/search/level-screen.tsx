import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { RadioCard } from "@/components/ui/selectable-card";
import { StepProgress } from "@/components/ui/step-progress";
import { type LevelsState, useLevels } from "@/hooks/use-levels";
import { useSearchWizardStore } from "@/store/search-wizard.store";
import type { EducationLevel } from "@/types/search";

const FOR_WHOM_ROUTE = "/search/for-whom" as Href;
const SUMMARY_ROUTE = "/search/summary" as Href;

export function LevelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { state, retry } = useLevels();
  const subject = useSearchWizardStore((s) => s.criteria.subject);
  const selectedLevel = useSearchWizardStore((s) => s.criteria.level);
  const setLevel = useSearchWizardStore((s) => s.setLevel);
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  const continueToForWhom = () => {
    if (isNavigating || !selectedLevel) return;
    setIsNavigating(true);
    if (from === "summary") {
      router.push(SUMMARY_ROUTE);
    } else {
      router.push(FOR_WHOM_ROUTE);
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={2} total={7} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[26px] font-bold text-ink">Quel est le niveau concerné&nbsp;?</Text>
          <Text className="mb-5 text-[14px] text-ink-soft">{subject?.label ?? " "}</Text>
        </FadeIn>

        <LevelList state={state} selectedId={selectedLevel?.id ?? null} onRetry={retry} onSelect={setLevel} />
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button label="Continuer" disabled={!selectedLevel || isNavigating} onPress={continueToForWhom} />
      </View>
    </View>
  );
}

type LevelListProps = {
  state: LevelsState;
  selectedId: string | null;
  onRetry: () => void;
  onSelect: (level: EducationLevel) => void;
};

function LevelList({ state, selectedId, onRetry, onSelect }: LevelListProps) {
  if (state.status === "loading") {
    return (
      <View className="gap-[10px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} className="h-[54px] rounded-lg bg-line-soft" />
        ))}
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-[13.5px] text-error">{state.message}</Text>
        <PressableScale onPress={onRetry} accessibilityLabel="Réessayer de charger les niveaux">
          <Text className="text-[13.5px] font-semibold text-primary">Réessayer</Text>
        </PressableScale>
      </View>
    );
  }

  if (state.status === "empty") {
    return <Text className="text-[13.5px] text-ink-faint">Aucun niveau disponible pour le moment.</Text>;
  }

  return (
    <View className="gap-[10px]">
      {state.levels.map((level, index) => (
        <FadeIn key={level.id} delay={100 + index * 40}>
          <RadioCard label={level.label} selected={level.id === selectedId} onPress={() => onSelect(level)} />
        </FadeIn>
      ))}
    </View>
  );
}

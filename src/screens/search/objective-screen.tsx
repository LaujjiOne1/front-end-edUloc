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
import { type ObjectivesState, useObjectives } from "@/hooks/use-objectives";
import { useSearchWizardStore } from "@/store/search-wizard.store";
import type { LearningObjective } from "@/types/search";

const DETAIL_ROUTE = "/search/detail" as Href;
const SUMMARY_ROUTE = "/search/summary" as Href;

export function ObjectiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { state, retry } = useObjectives();
  const selectedObjective = useSearchWizardStore((s) => s.criteria.objective);
  const setObjective = useSearchWizardStore((s) => s.setObjective);
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  const continueToDetail = () => {
    if (isNavigating || !selectedObjective) return;
    setIsNavigating(true);
    if (from === "summary") {
      router.push(SUMMARY_ROUTE);
    } else {
      router.push(DETAIL_ROUTE);
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={5} total={7} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-5 text-[26px] font-bold text-ink">Quel est votre objectif&nbsp;?</Text>
        </FadeIn>

        <ObjectiveList
          state={state}
          selectedId={selectedObjective?.id ?? null}
          onRetry={retry}
          onSelect={setObjective}
        />
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button label="Continuer" disabled={!selectedObjective || isNavigating} onPress={continueToDetail} />
      </View>
    </View>
  );
}

type ObjectiveListProps = {
  state: ObjectivesState;
  selectedId: string | null;
  onRetry: () => void;
  onSelect: (objective: LearningObjective) => void;
};

function ObjectiveList({ state, selectedId, onRetry, onSelect }: ObjectiveListProps) {
  if (state.status === "loading") {
    return (
      <View className="gap-[10px]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="h-[54px] rounded-lg bg-line-soft" />
        ))}
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-[13.5px] text-error">{state.message}</Text>
        <PressableScale onPress={onRetry} accessibilityLabel="Réessayer de charger les objectifs">
          <Text className="text-[13.5px] font-semibold text-primary">Réessayer</Text>
        </PressableScale>
      </View>
    );
  }

  if (state.status === "empty") {
    return <Text className="text-[13.5px] text-ink-faint">Aucun objectif disponible pour le moment.</Text>;
  }

  return (
    <View className="gap-[10px]">
      {state.objectives.map((objective, index) => (
        <FadeIn key={objective.id} delay={90 + index * 40}>
          <RadioCard
            label={objective.label}
            selected={objective.id === selectedId}
            onPress={() => onSelect(objective)}
          />
        </FadeIn>
      ))}
    </View>
  );
}

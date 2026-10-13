import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FinanceIcon,
  GraduationCapIcon,
  type IconProps,
  LanguagesIcon,
  LevelIcon,
  ScienceIcon,
  SearchIcon,
  SubjectIcon,
} from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { MenuCard } from "@/components/ui/selectable-card";
import { StepProgress } from "@/components/ui/step-progress";
import { type SubjectsState, useSubjects } from "@/hooks/use-subjects";
import { useSearchWizardStore } from "@/store/search-wizard.store";
import type { Category } from "@/types/category";
import type { ComponentType } from "react";

const LEVEL_ROUTE = "/search/level" as Href;
const SUMMARY_ROUTE = "/search/summary" as Href;

// "programming" reuses SubjectIcon and "math" reuses LevelIcon — those
// generic icons already match the exact glyphs used for these two
// categories in the reference design.
const SUBJECT_ICONS: Record<string, ComponentType<IconProps>> = {
  programming: SubjectIcon,
  math: LevelIcon,
  languages: LanguagesIcon,
  finance: FinanceIcon,
  sciences: ScienceIcon,
  methodology: GraduationCapIcon,
};

export function NeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { state, retry } = useSubjects();
  const setSubject = useSearchWizardStore((s) => s.setSubject);
  const [query, setQuery] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  const selectSubject = (subject: Category) => {
    if (isNavigating) return;
    setIsNavigating(true);
    setSubject(subject);
    if (from === "summary") {
      router.push(SUMMARY_ROUTE);
    } else {
      router.push(LEVEL_ROUTE);
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={1} total={7} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[26px] font-bold text-ink">Que recherchez-vous&nbsp;?</Text>
          <Text className="mb-5 text-[14px] text-ink-soft">Choisissez une matière ou un domaine</Text>
        </FadeIn>

        <FadeIn delay={90}>
          <View className="mb-[18px] flex-row items-center gap-[10px] rounded-sm border border-line bg-surface px-[14px] py-[13px]">
            <SearchIcon size={17} color="#9799AF" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher une matière"
              placeholderTextColor="#9799AF"
              className="flex-1 text-[15px] text-ink"
              accessibilityLabel="Rechercher une matière"
            />
          </View>
        </FadeIn>

        <SubjectList
          state={state}
          query={query}
          onRetry={retry}
          onSelect={selectSubject}
          disabled={isNavigating}
        />
      </ScrollView>
    </View>
  );
}

type SubjectListProps = {
  state: SubjectsState;
  query: string;
  onRetry: () => void;
  onSelect: (subject: Category) => void;
  disabled: boolean;
};

function SubjectList({ state, query, onRetry, onSelect, disabled }: SubjectListProps) {
  if (state.status === "loading") {
    return (
      <View className="gap-[10px]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="h-[70px] rounded-lg bg-line-soft" />
        ))}
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-[13.5px] text-error">{state.message}</Text>
        <PressableScale onPress={onRetry} accessibilityLabel="Réessayer de charger les matières">
          <Text className="text-[13.5px] font-semibold text-primary">Réessayer</Text>
        </PressableScale>
      </View>
    );
  }

  if (state.status === "empty") {
    return <Text className="text-[13.5px] text-ink-faint">Aucune matière disponible pour le moment.</Text>;
  }

  const q = query.trim().toLowerCase();
  const subjects = q ? state.categories.filter((c) => c.label.toLowerCase().includes(q)) : state.categories;

  if (subjects.length === 0) {
    return (
      <Text className="text-[13.5px] text-ink-faint">
        Aucune matière ne correspond à « {query.trim()} ».
      </Text>
    );
  }

  return (
    <View className="gap-[10px]">
      {subjects.map((subject, index) => {
        const Icon = SUBJECT_ICONS[subject.id] ?? SubjectIcon;
        return (
          <FadeIn key={subject.id} delay={130 + index * 40}>
            <MenuCard
              icon={<Icon size={19} color="#332E86" />}
              title={subject.label}
              onPress={() => onSelect(subject)}
              disabled={disabled}
            />
          </FadeIn>
        );
      })}
    </View>
  );
}

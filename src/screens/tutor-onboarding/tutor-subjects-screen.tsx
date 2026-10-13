import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckIcon, SparklesIcon } from "@/components/icons";
import { levelsForSkill } from "@/lib/degree-policy";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { StepProgress } from "@/components/ui/step-progress";
import { useLevels } from "@/hooks/use-levels";
import { useTutorApplicationStore } from "@/store/tutor-application.store";
import type { EducationLevel } from "@/types/search";
import type { TutorSkill } from "@/types/tutor-application";

const TUTOR_BIO_ROUTE = "/tutor-bio" as Href;
const TUTOR_SKILLS_ROUTE = "/tutor-skills" as Href;
const TOTAL_STEPS = 9;

export function TutorSubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state: levelsState, retry } = useLevels();
  const skills = useTutorApplicationStore((s) => s.skills);
  const background = useTutorApplicationStore((s) => s.background);
  const subjectLevels = useTutorApplicationStore((s) => s.subjectLevels);
  const toggleSubjectLevel = useTutorApplicationStore((s) => s.toggleSubjectLevel);
  const toggleSkill = useTutorApplicationStore((s) => s.toggleSkill);

  // Guard: this step only makes sense once at least one skill was picked on TutorSkills
  useEffect(() => {
    if (skills.length === 0) router.replace(TUTOR_SKILLS_ROUTE);
  }, [skills.length, router]);

  if (skills.length === 0) return null;

  // Le diplôme borne les niveaux enseignables ; la compétence, ceux où elle a un sens (le serveur re-vérifie).
  const degreeId = background.degree?.id ?? null;
  const degreeLabel = background.degree?.label ?? "votre diplôme";
  const allLevels = levelsState.status === "success" ? levelsState.levels : [];

  const canContinue = skills.every(
    (skill) =>
      levelsForSkill(allLevels, skill, degreeId).length > 0 &&
      (subjectLevels.find((sl) => sl.skill.id === skill.id)?.levels.length ?? 0) > 0,
  );

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={4} total={TOTAL_STEPS} title="Niveaux enseignés" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Matières et niveaux</Text>
          <Text className="mb-3 text-[13.5px] text-ink-soft">
            Pour chaque compétence, précisez les niveaux que vous souhaitez dispenser
          </Text>

          {/* Indication visuelle explicite de choix multiple */}
          <View className="mb-4 flex-row items-center gap-2 rounded-lg bg-accent-tint/40 px-3.5 py-2.5">
            <CheckIcon size={16} color="#0E9C82" />
            <Text className="flex-1 text-[12.5px] font-semibold text-accent">
              Choix multiple : vous pouvez sélectionner un ou plusieurs niveaux par matière.
            </Text>
          </View>

          {/* Les niveaux proposés suivent le diplôme (qualification) */}
          {background.degree ? (
            <View className="mb-4 flex-row items-start gap-2 rounded-lg border border-line bg-surface p-3">
              <SparklesIcon size={14} color="#332E86" />
              <Text className="flex-1 text-[12.5px] text-ink-soft">
                Niveaux proposés selon votre diplôme ({degreeLabel}) et selon chaque matière : vous ne voyez que
                ceux que vous pouvez enseigner.
              </Text>
            </View>
          ) : null}
        </FadeIn>

        {levelsState.status === "loading" ? (
          <View className="gap-3">
            {skills.map((skill) => (
              <View key={skill.id} className="h-[96px] rounded-lg bg-line-soft" />
            ))}
          </View>
        ) : levelsState.status === "error" ? (
          <View className="flex-row items-center gap-3">
            <Text className="flex-1 text-[13.5px] text-error">{levelsState.message}</Text>
            <PressableScale onPress={retry} accessibilityLabel="Réessayer de charger les niveaux">
              <Text className="text-[13.5px] font-semibold text-primary">Réessayer</Text>
            </PressableScale>
          </View>
        ) : levelsState.status === "empty" ? (
          <Text className="text-[13.5px] text-ink-faint">Aucun niveau disponible pour le moment.</Text>
        ) : (
          <View className="gap-3.5">
            {skills.map((skill, index) => {
              const chosenLevels = subjectLevels.find((sl) => sl.skill.id === skill.id)?.levels ?? [];
              return (
                <FadeIn key={skill.id} delay={90 + index * 40}>
                  <SubjectCard
                    skill={skill}
                    levels={levelsForSkill(levelsState.levels, skill, degreeId)}
                    chosenLevels={chosenLevels}
                    onToggleLevel={(level) => toggleSubjectLevel(skill, level)}
                    onRemove={() => toggleSkill(skill)}
                  />
                </FadeIn>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label="Continuer"
          disabled={!canContinue}
          onPress={() => router.push(TUTOR_BIO_ROUTE)}
        />
      </View>
    </View>
  );
}

type SubjectCardProps = {
  skill: TutorSkill;
  levels: EducationLevel[];
  chosenLevels: EducationLevel[];
  onToggleLevel: (level: EducationLevel) => void;
  onRemove: () => void;
};

function SubjectCard({ skill, levels, chosenLevels, onToggleLevel, onRemove }: SubjectCardProps) {
  const chosenIds = new Set(chosenLevels.map((l) => l.id));
  // Regroupés par catégorie (Primaire, Collège, Lycée, Université) pour rester lisibles.
  const groups = levels.reduce<{ category: string; levels: EducationLevel[] }[]>((acc, level) => {
    const category = level.category ?? "";
    const group = acc.find((g) => g.category === category);
    if (group) group.levels.push(level);
    else acc.push({ category, levels: [level] });
    return acc;
  }, []);

  return (
    <View className="rounded-lg border border-line bg-surface p-4">
      <View className="mb-[10px] flex-row items-center justify-between">
        <Text className="flex-1 text-[15.5px] font-bold text-ink">{skill.label}</Text>
        <Text className="text-[12px] font-semibold text-primary">
          {chosenLevels.length} sélectionné{chosenLevels.length > 1 ? "s" : ""}
        </Text>
      </View>

      {levels.length === 0 ? (
        <View className="gap-2">
          <Text className="text-[13px] text-error">
            Aucun niveau de cette compétence ne correspond à votre diplôme.
          </Text>
          <PressableScale onPress={onRemove} accessibilityLabel={`Retirer ${skill.label}`}>
            <Text className="text-[13px] font-semibold text-primary">Retirer cette compétence</Text>
          </PressableScale>
        </View>
      ) : (
        <View className="gap-3">
          {groups.map((group) => (
            <View key={group.category} className="gap-2">
              {group.category ? (
                <Text className="text-[11.5px] font-semibold uppercase text-ink-faint">{group.category}</Text>
              ) : null}
              <View className="flex-row flex-wrap gap-2">
                {group.levels.map((level) => (
                  <Chip
                    key={level.id}
                    label={level.label}
                    active={chosenIds.has(level.id)}
                    onPress={() => onToggleLevel(level)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

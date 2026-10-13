import { type Href, useRouter } from "expo-router";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { SkillCombobox } from "@/components/ui/skill-combobox";
import { StepProgress } from "@/components/ui/step-progress";
import { useTutorApplicationStore } from "@/store/tutor-application.store";

const TUTOR_SUBJECTS_ROUTE = "/tutor-subjects" as Href;
const TOTAL_STEPS = 9;
const MAX_SCOPE_LENGTH = 500;

/**
 * « Qu'enseignez-vous ? » : le tuteur tape, l'app suggère les compétences existantes adaptées à son
 * diplôme, ou propose d'en créer une nouvelle. Pour chaque compétence, il précise le périmètre de son cours.
 */
export function TutorSkillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const skills = useTutorApplicationStore((s) => s.skills);
  const degree = useTutorApplicationStore((s) => s.background.degree);
  const addSkill = useTutorApplicationStore((s) => s.addSkill);
  const toggleSkill = useTutorApplicationStore((s) => s.toggleSkill);
  const setSkillScope = useTutorApplicationStore((s) => s.setSkillScope);

  const canContinue = skills.length > 0;

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={3} total={TOTAL_STEPS} title="Compétences" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Qu&apos;enseignez-vous&nbsp;?</Text>
          <Text className="mb-4 text-[13.5px] text-ink-soft">
            Recherchez vos matières et compétences, puis précisez le périmètre de vos cours. Une compétence
            introuvable peut être ajoutée.
          </Text>
        </FadeIn>

        <FadeIn delay={80}>
          <SkillCombobox degree={degree?.id ?? null} selected={skills} onSelect={addSkill} />
        </FadeIn>

        <View className="mt-5 gap-[10px]">
          {skills.length === 0 ? (
            <View className="items-center rounded-lg border border-dashed border-line px-4 py-6">
              <Text className="text-center text-[13.5px] text-ink-faint">
                Aucune compétence ajoutée pour le moment. Commencez à taper ci-dessus.
              </Text>
            </View>
          ) : (
            <Text className="text-[12px] font-semibold uppercase text-ink-faint">
              Vos compétences ({skills.length})
            </Text>
          )}

          {skills.map((skill) => (
            <FadeIn key={skill.id} delay={40}>
              <View className="rounded-lg border border-primary bg-primary-tint/20 p-3.5">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1 flex-row flex-wrap items-center gap-2">
                    <Text className="text-[15px] font-bold text-ink">{skill.label}</Text>
                    {skill.category ? (
                      <View className="rounded bg-paper px-2 py-0.5">
                        <Text className="text-[11px] font-semibold text-ink-soft">{skill.category}</Text>
                      </View>
                    ) : null}
                    {skill.isVerified ? null : (
                      <View className="rounded bg-accent-tint px-2 py-0.5">
                        <Text className="text-[11px] font-semibold text-accent">Nouvelle · validée avec votre dossier</Text>
                      </View>
                    )}
                  </View>
                  <PressableScale onPress={() => toggleSkill(skill)} accessibilityLabel={`Retirer ${skill.label}`}>
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-paper">
                      <XIcon size={14} color="#585B78" />
                    </View>
                  </PressableScale>
                </View>

                <Text className="mb-1 mt-3 text-[12.5px] font-semibold text-ink-soft">
                  Périmètre du cours (facultatif)
                </Text>
                <TextInput
                  value={skill.scope ?? ""}
                  onChangeText={(value) => setSkillScope(skill.id, value)}
                  placeholder="Ex : préparation au BAC, remise à niveau, exercices types…"
                  placeholderTextColor="#9799AF"
                  multiline
                  maxLength={MAX_SCOPE_LENGTH}
                  className="min-h-[60px] rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink"
                  accessibilityLabel={`Périmètre du cours : ${skill.label}`}
                />
              </View>
            </FadeIn>
          ))}
        </View>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label={`Continuer (${skills.length} sélectionnée${skills.length > 1 ? "s" : ""})`}
          disabled={!canContinue}
          onPress={() => router.push(TUTOR_SUBJECTS_ROUTE)}
        />
      </View>
    </View>
  );
}

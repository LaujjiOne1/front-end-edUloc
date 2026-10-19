import { type Href, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HouseIcon, VideoIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { CheckboxCard } from "@/components/ui/selectable-card";
import { StepProgress } from "@/components/ui/step-progress";
import { useTutorApplicationStore } from "@/store/tutor-application.store";
import type { InPersonModeId, LocationFormatId } from "@/types/common";

const TUTOR_LOCATIONS_ROUTE = "/tutor-locations" as Href;
const TOTAL_STEPS = 9;

const FORMAT_OPTIONS: { id: LocationFormatId; label: string; icon: typeof HouseIcon }[] = [
  { id: "in_person", label: "En présentiel", icon: HouseIcon },
  { id: "online", label: "En ligne", icon: VideoIcon },
];

const IN_PERSON_OPTIONS: { id: InPersonModeId; label: string; hint: string }[] = [
  { id: "beneficiary_home", label: "Je me déplace chez l'élève", hint: "Dans la zone que vous choisirez ensuite" },
  { id: "tutor_home", label: "J'accueille chez moi", hint: "À votre adresse — elle n'est communiquée qu'après confirmation" },
  { id: "public_place", label: "Dans un lieu public", hint: "Bibliothèque, campus, tiers-lieu…" },
];

export function TutorFormatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formats = useTutorApplicationStore((s) => s.formats);
  const toggleFormat = useTutorApplicationStore((s) => s.toggleFormat);
  const inPersonModes = useTutorApplicationStore((s) => s.inPersonModes);
  const toggleInPersonMode = useTutorApplicationStore((s) => s.toggleInPersonMode);

  const inPerson = formats.includes("in_person");
  // Le présentiel exige de préciser au moins une façon d'enseigner.
  const canContinue = formats.length > 0 && (!inPerson || inPersonModes.length > 0);

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={7} total={TOTAL_STEPS} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">
            Comment souhaitez-vous enseigner&nbsp;?
          </Text>
          <Text className="mb-5 text-[13.5px] text-ink-soft">Choisissez un ou plusieurs formats</Text>
        </FadeIn>

        <FadeIn delay={90}>
          <View className="gap-[10px]">
            {FORMAT_OPTIONS.map(({ id, label, icon: Icon }) => (
              <View key={id}>
                <CheckboxCard
                  label={label}
                  selected={formats.includes(id)}
                  onPress={() => toggleFormat(id)}
                  icon={<Icon size={17} color="#332E86" />}
                />
                {id === "in_person" && inPerson ? (
                  <View className="ml-4 mt-[10px] gap-[10px] border-l-2 border-line pl-3">
                    <Text className="text-[12.5px] text-ink-soft">Où donnez-vous vos cours en présentiel ?</Text>
                    {IN_PERSON_OPTIONS.map((option) => (
                      <View key={option.id}>
                        <CheckboxCard
                          label={option.label}
                          selected={inPersonModes.includes(option.id)}
                          onPress={() => toggleInPersonMode(option.id)}
                        />
                        <Text className="ml-1 mt-1 text-[12px] text-ink-faint">{option.hint}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label="Continuer"
          disabled={!canContinue}
          onPress={() => router.push(TUTOR_LOCATIONS_ROUTE)}
        />
      </View>
    </View>
  );
}

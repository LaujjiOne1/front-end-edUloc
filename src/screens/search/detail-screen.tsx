import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MicIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { StepProgress } from "@/components/ui/step-progress";
import { useSearchWizardStore } from "@/store/search-wizard.store";

const SUMMARY_ROUTE = "/search/summary" as Href;

export function DetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isFromSummary = from === "summary";
  const note = useSearchWizardStore((s) => s.criteria.detail.note);
  const setDetailNote = useSearchWizardStore((s) => s.setDetailNote);
  const [isNavigating, setIsNavigating] = useState(false);
  const [voiceNoteNotice, setVoiceNoteNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  const addVoiceNote = () => {
    // Real voice-note capture needs a native recorder (expo-av / expo-audio,
    // not installed) plus a media-upload endpoint — out of scope for this
    // task. Surfacing this honestly rather than faking a successful record.
    setVoiceNoteNotice("L'enregistrement vocal arrive bientôt.");
  };

  const continueToSummary = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(SUMMARY_ROUTE);
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={6} total={7} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[26px] font-bold text-ink">Précisez votre besoin</Text>
          <Text className="mb-5 text-[14px] text-ink-soft">
            Facultatif — le tuteur pourra mieux préparer la séance
          </Text>
        </FadeIn>

        <FadeIn delay={90}>
          <TextInput
            value={note}
            onChangeText={setDetailNote}
            placeholder="Décrivez ce dont vous avez besoin…"
            placeholderTextColor="#9799AF"
            multiline
            textAlignVertical="top"
            className="h-[120px] rounded-sm border border-line bg-surface px-[14px] py-[13px] text-[15px] text-ink"
            accessibilityLabel="Décrivez ce dont vous avez besoin"
          />
        </FadeIn>

        <FadeIn delay={140}>
          <PressableScale onPress={addVoiceNote} accessibilityLabel="Ajouter un vocal">
            <View className="mt-4 flex-row items-center gap-[14px] rounded-lg border border-dashed border-line bg-surface p-4">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-accent-tint">
                <MicIcon size={20} color="#0E9C82" />
              </View>
              <View className="flex-1">
                <Text className="text-[14.5px] font-bold text-ink">Ajouter un vocal</Text>
                <Text className="text-[12.5px] text-ink-soft">Expliquez votre besoin à l&apos;oral</Text>
              </View>
            </View>
          </PressableScale>
          {voiceNoteNotice ? <Text className="mt-2 text-[12.5px] text-ink-faint">{voiceNoteNotice}</Text> : null}
        </FadeIn>

        <FadeIn delay={180}>
          <Text className="mt-[14px] text-[12.5px] leading-[19px] text-ink-faint">
            EduLoc privilégie les échanges vocaux et les documents avec votre tuteur — pas de messagerie texte
            classique.
          </Text>
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label={isFromSummary ? "Enregistrer les modifications" : "Voir le récapitulatif"}
          disabled={isNavigating}
          onPress={continueToSummary}
        />
      </View>
    </View>
  );
}

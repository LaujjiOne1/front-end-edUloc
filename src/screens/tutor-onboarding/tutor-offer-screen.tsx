import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { StepProgress } from "@/components/ui/step-progress";
import { useLevels } from "@/hooks/use-levels";
import { useTracks } from "@/hooks/use-tracks";
import { levelsForSkill } from "@/lib/degree-policy";
import { offerLevelLabel, trackShortLabel } from "@/lib/offer-labels";
import { trackKindOf } from "@/lib/search-funnel";
import { type TutorOfferDraft, useTutorApplicationStore } from "@/store/tutor-application.store";
import type { EducationLevel } from "@/types/search";
import type { TutorSkill } from "@/types/tutor-application";

const TUTOR_FORMAT_ROUTE = "/tutor-format" as Href;
const TUTOR_SKILLS_ROUTE = "/tutor-skills" as Href;
const TOTAL_STEPS = 9;

/**
 * Une carte par matière, reprise de l'étape « Qu'enseignez-vous ? » : le tuteur ne rechoisit pas la matière, il fixe
 * seulement un prix horaire pour chacun des niveaux qu'il a déclarés (et la série pour Première / Terminale).
 */
export function TutorOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const skills = useTutorApplicationStore((s) => s.skills);
  const offers = useTutorApplicationStore((s) => s.offers);
  const syncOffersWithLevels = useTutorApplicationStore((s) => s.syncOffersWithLevels);
  const toggleSkill = useTutorApplicationStore((s) => s.toggleSkill);

  // Les lignes de tarif suivent les niveaux déclarés à l'étape précédente.
  useEffect(() => {
    syncOffersWithLevels();
  }, [syncOffersWithLevels]);

  // Guard : cette étape n'a de sens qu'avec au moins une compétence choisie.
  useEffect(() => {
    if (skills.length === 0) router.replace(TUTOR_SKILLS_ROUTE);
  }, [skills.length, router]);

  if (skills.length === 0) return null;

  const enabledOffers = offers.filter((o) => o.enabled);
  const canContinue =
    enabledOffers.length > 0 &&
    enabledOffers.every((o) => o.hourlyRate > 0 && (trackKindOf(o.level) !== "serie" || !!o.track));

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={6} total={TOTAL_STEPS} title="Offres & Tarification" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Vos tarifs</Text>
          <Text className="mb-4 text-[13.5px] text-ink-soft">
            Fixez un prix par heure pour chaque niveau que vous enseignez. Décochez un niveau pour ne pas le proposer.
          </Text>
        </FadeIn>

        <View className="gap-3.5">
          {skills.map((skill, index) => (
            <FadeIn key={skill.id} delay={80 + index * 40}>
              <SkillOfferCard skill={skill} onRemove={() => toggleSkill(skill)} />
            </FadeIn>
          ))}
        </View>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button label="Continuer" disabled={!canContinue} onPress={() => router.push(TUTOR_FORMAT_ROUTE)} />
      </View>
    </KeyboardAvoidingView>
  );
}

function SkillOfferCard({ skill, onRemove }: { skill: TutorSkill; onRemove: () => void }) {
  const offers = useTutorApplicationStore((s) => s.offers);
  const degreeId = useTutorApplicationStore((s) => s.background.degree?.id ?? null);
  const addLevelOffer = useTutorApplicationStore((s) => s.addLevelOffer);
  const { state: levelsState } = useLevels();
  const [isPicking, setIsPicking] = useState(false);

  // Index dans le store : les mises à jour passent par la position de la ligne.
  const rows = offers.map((offer, index) => ({ offer, index })).filter((r) => r.offer.skill?.id === skill.id);
  const selectedLabels = rows
    .filter((r) => r.offer.enabled && r.offer.level)
    .map((r) => offerLevelLabel(r.offer.level!, r.offer.track));

  // « Ajouter un niveau » : les niveaux que le diplôme et la matière permettent, sans doublon — sauf Première et
  // Terminale, qui acceptent une ligne par série.
  const allLevels = levelsState.status === "success" ? levelsState.levels : [];
  const addable = levelsForSkill(allLevels, skill, degreeId).filter(
    (level) => trackKindOf(level) === "serie" || !rows.some((r) => r.offer.level?.id === level.id),
  );

  const addLevel = (level: EducationLevel) => {
    addLevelOffer(skill, level);
    setIsPicking(false);
  };

  return (
    <View className="rounded-xl border border-line bg-surface p-4">
      <Text className="text-[12px] font-semibold uppercase tracking-[0.03em] text-ink-faint">Matière</Text>
      <Text className="mb-[6px] text-[18px] font-bold text-ink">{skill.label}</Text>
      <Text className="mb-3 text-[13px] text-ink-soft">
        {selectedLabels.length > 0 ? `Niveaux sélectionnés : ${selectedLabels.join(", ")}` : "Aucun niveau sélectionné"}
      </Text>

      <Text className="mb-[6px] text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">
        Tarifs par niveau
      </Text>
      <View className="gap-2.5">
        {rows.map(({ offer, index }) => (
          <OfferRow key={offer.id} offer={offer} index={index} />
        ))}
        {rows.length === 0 ? (
          <Text className="text-[13px] text-ink-faint">Ajoutez un niveau pour fixer un prix.</Text>
        ) : null}
      </View>

      {isPicking ? (
        <FadeIn delay={0}>
          <View className="mt-3 rounded-lg border border-line bg-paper p-3">
            <Text className="mb-2 text-[12.5px] font-semibold text-ink-soft">Choisissez un niveau</Text>
            {levelsState.status === "loading" ? (
              <Text className="text-[13px] text-ink-faint">Chargement…</Text>
            ) : addable.length === 0 ? (
              <Text className="text-[13px] text-ink-faint">Aucun autre niveau disponible pour cette matière.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {addable.map((level) => (
                  <Chip key={level.id} label={level.label} onPress={() => addLevel(level)} />
                ))}
              </View>
            )}
          </View>
        </FadeIn>
      ) : null}

      <View className="mt-4 flex-row items-center justify-between gap-3 border-t border-line-soft pt-3">
        <PressableScale onPress={() => setIsPicking((v) => !v)} accessibilityLabel={`Ajouter un niveau pour ${skill.label}`}>
          <View className="flex-row items-center gap-1.5 rounded-full border border-dashed border-primary px-3.5 py-2">
            <PlusIcon size={14} color="#332E86" />
            <Text className="text-[12.5px] font-bold text-primary">Ajouter un niveau</Text>
          </View>
        </PressableScale>
        <PressableScale onPress={onRemove} accessibilityLabel={`Supprimer la matière ${skill.label}`}>
          <View className="flex-row items-center gap-1.5 px-2 py-2">
            <TrashIcon size={14} color="#C0392B" />
            <Text className="text-[12.5px] font-bold text-error">Supprimer la matière</Text>
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

/** Une ligne de tarif : case à cocher, niveau (+ série pour Première / Terminale), prix par heure. */
function OfferRow({ offer, index }: { offer: TutorOfferDraft; index: number }) {
  const updateOfferAtIndex = useTutorApplicationStore((s) => s.updateOfferAtIndex);
  const removeOfferAtIndex = useTutorApplicationStore((s) => s.removeOfferAtIndex);
  const siblings = useTutorApplicationStore((s) => s.offers.filter((o) => o.skill?.id === offer.skill?.id && o.level?.id === offer.level?.id).length);
  const kind = trackKindOf(offer.level);
  const { state: tracksState } = useTracks(kind === "serie" ? "serie" : null, offer.level?.label);
  const series = tracksState.status === "success" ? tracksState.tracks : [];
  const missingTrack = kind === "serie" && !offer.track;

  if (!offer.level) return null;

  return (
    <View className={["rounded-lg border p-3", offer.enabled ? "border-line bg-paper" : "border-line-soft bg-surface"].join(" ")}>
      <View className="flex-row items-center gap-3">
        <PressableScale
          onPress={() => updateOfferAtIndex(index, { enabled: !offer.enabled })}
          accessibilityLabel={`${offer.enabled ? "Ne plus proposer" : "Proposer"} ${offerLevelLabel(offer.level, offer.track)}`}
        >
          <View
            className={[
              "h-5 w-5 items-center justify-center rounded-[6px] border-2",
              offer.enabled ? "border-primary bg-primary" : "border-line bg-surface",
            ].join(" ")}
          >
            {offer.enabled ? <CheckIcon size={11} color="#fff" /> : null}
          </View>
        </PressableScale>

        <Text className={["flex-1 text-[14.5px] font-bold", offer.enabled ? "text-ink" : "text-ink-faint"].join(" ")}>
          {offerLevelLabel(offer.level, offer.track)}
        </Text>

        <View className="flex-row items-center gap-1.5">
          <TextInput
            value={offer.hourlyRate > 0 ? String(offer.hourlyRate) : ""}
            onChangeText={(value) => updateOfferAtIndex(index, { hourlyRate: parseInt(value.replace(/\D/g, ""), 10) || 0 })}
            editable={offer.enabled}
            keyboardType="number-pad"
            placeholder="____"
            placeholderTextColor="#9799AF"
            className="h-10 w-[92px] rounded-md border border-line bg-surface px-3 text-right text-[15px] font-bold text-ink"
            accessibilityLabel={`Prix par heure pour ${offerLevelLabel(offer.level, offer.track)}`}
          />
          <Text className="text-[12px] text-ink-soft">Ar / heure</Text>
        </View>

        {siblings > 1 ? (
          <PressableScale onPress={() => removeOfferAtIndex(index)} accessibilityLabel="Retirer cette ligne">
            <TrashIcon size={15} color="#9799AF" />
          </PressableScale>
        ) : null}
      </View>

      {kind === "serie" && offer.enabled ? (
        <View className="mt-2.5">
          <Text className="mb-1.5 text-[12px] font-semibold text-ink-soft">
            Série{missingTrack ? " (obligatoire)" : ""}
          </Text>
          {tracksState.status === "loading" ? (
            <Text className="text-[12.5px] text-ink-faint">Chargement…</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {series.map((track) => (
                <Chip
                  key={track.id}
                  label={trackShortLabel(track)}
                  active={offer.track?.id === track.id}
                  onPress={() => updateOfferAtIndex(index, { track })}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

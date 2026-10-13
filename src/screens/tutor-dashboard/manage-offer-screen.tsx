import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { type SelectOption, SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { useOffer } from "@/hooks/use-offer";
import { type OfferSaveInput, useOfferActions, type OfferActionState } from "@/hooks/use-offer-actions";
import { useTutorProfile } from "@/hooks/use-tutor-profile";
import { OfferStatusBadge } from "@/screens/tutor-dashboard/offers-screen";
import type { Offer } from "@/types/offer";
import type { TutorProfileSummary } from "@/types/tutor-profile";

type OfferDurationId = "1h" | "1h30" | "2h" | "3h";

const OFFERS_ROUTE = "/tutor-dashboard/offers" as Href;

// The spec doesn't define a duration catalog — same fixed set already used by
// the onboarding's TutorOfferScreen (44_TutorOffer), flagged rather than
// invented as a business rule (AGENTS.md §11). `minutes` is just the numeric
// equivalent of each label, required by CreateOfferInput.durationMinutes.
const DURATION_OPTIONS: { id: OfferDurationId; label: string; minutes: number }[] = [
  { id: "1h", label: "1 heure", minutes: 60 },
  { id: "1h30", label: "1 heure 30", minutes: 90 },
  { id: "2h", label: "2 heures", minutes: 120 },
  { id: "3h", label: "3 heures", minutes: 180 },
];

export function ManageOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { state: offerState, retry: retryOffer } = useOffer(id);
  const { state: profileState } = useTutorProfile();
  const { state: actionState, save, toggleStatus } = useOfferActions();

  // Create mode needs the tutor's own subjects (Matière/Niveau options) —
  // wait for that load too, rather than briefly showing "no subjects".
  const isLoading = (isEditMode && offerState.status === "loading") || (!isEditMode && profileState.status === "loading");

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#332E86" />
      </View>
    );
  }
  if (isEditMode && offerState.status === "error") {
    return (
      <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
        <AuthHeader onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-[14px] text-error">{offerState.message}</Text>
          <PressableScale onPress={retryOffer} accessibilityLabel="Réessayer">
            <Text className="text-[14px] font-semibold text-primary">Réessayer</Text>
          </PressableScale>
        </View>
      </View>
    );
  }

  const existingOffer = isEditMode && offerState.status === "success" ? offerState.offer : null;

  return (
    <ManageOfferForm
      insetsTop={insets.top}
      insetsBottom={insets.bottom}
      onBack={() => router.back()}
      existingOffer={existingOffer}
      profile={profileState.status === "success" ? profileState.profile : null}
      actionState={actionState}
      onSave={async (input) => {
        const offer = await save(input);
        if (offer) router.replace(OFFERS_ROUTE);
      }}
      onToggleStatus={async (offerId, nextActive) => {
        const offer = await toggleStatus(offerId, nextActive);
        if (offer) retryOffer();
      }}
    />
  );
}

type ManageOfferFormProps = {
  insetsTop: number;
  insetsBottom: number;
  onBack: () => void;
  existingOffer: Offer | null;
  profile: TutorProfileSummary | null;
  actionState: OfferActionState;
  onSave: (input: OfferSaveInput) => void;
  onToggleStatus: (offerId: string, nextActive: boolean) => void;
};

function ManageOfferForm({
  insetsTop,
  insetsBottom,
  onBack,
  existingOffer,
  profile,
  actionState,
  onSave,
  onToggleStatus,
}: ManageOfferFormProps) {
  const [title, setTitle] = useState(existingOffer?.title ?? "");
  const [description, setDescription] = useState(existingOffer?.description ?? "");
  const [duration, setDuration] = useState<{ id: OfferDurationId; label: string; minutes: number } | null>(
    existingOffer ? (DURATION_OPTIONS.find((d) => d.label === existingOffer.durationLabel) ?? null) : null,
  );
  const [price, setPrice] = useState(existingOffer ? String(existingOffer.price.amount) : "");
  const [skillOption, setSkillOption] = useState<SelectOption | null>(null);
  const [levelOption, setLevelOption] = useState<SelectOption | null>(null);

  const skillOptions: SelectOption[] = profile ? profile.subjects.map((s) => ({ id: s.skill.id, label: s.skill.label })) : [];
  const levelOptions: SelectOption[] = profile ? (profile.subjects.find((s) => s.skill.id === skillOption?.id)?.levels ?? []) : [];

  const isEdit = !!existingOffer;
  const isSaving = actionState.status === "saving";
  const isToggling = actionState.status === "togglingStatus";
  const priceValue = Number(price.replace(",", "."));
  const hasValidPrice = price.trim().length > 0 && Number.isFinite(priceValue) && priceValue > 0;

  const canSubmit = isEdit
    ? title.trim().length > 0 && description.trim().length > 0 && !!duration && hasValidPrice
    : !!skillOption &&
      !!levelOption &&
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      !!duration &&
      hasValidPrice;

  const handleSubmit = () => {
    if (!canSubmit || !duration) return;
    if (isEdit && existingOffer) {
      onSave({
        mode: "edit",
        offerId: existingOffer.id,
        data: {
          title: title.trim(),
          description: description.trim(),
          durationMinutes: duration.minutes,
          price: priceValue,
        },
      });
    } else if (skillOption && levelOption) {
      onSave({
        mode: "create",
        data: {
          subjectId: skillOption.id,
          levelId: levelOption.id,
          title: title.trim(),
          description: description.trim(),
          durationMinutes: duration.minutes,
          price: priceValue,
          // No format selector in this form (no such field previously) —
          // default to présentiel, flagged rather than invented (AGENTS.md §11).
          format: "in_person",
        },
      });
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insetsTop }}>
      <AuthHeader onBack={onBack} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="mb-[18px] flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-[22px] font-bold text-ink">{existingOffer ? existingOffer.title : "Nouvelle offre"}</Text>
          {existingOffer ? <OfferStatusBadge isActive={existingOffer.isActive} /> : null}
        </View>

        {actionState.status === "error" ? <FormError message={actionState.message} /> : null}

        <TextField label="Titre" value={title} onChangeText={setTitle} placeholder="Python pour débutants" />

        {existingOffer ? (
          <>
            <ReadOnlyField label="Matière" value={existingOffer.subjectLabel} />
            <ReadOnlyField label="Niveau" value={existingOffer.levelLabel} />
          </>
        ) : (
          <>
            <SelectField
              label="Matière"
              value={skillOption}
              options={skillOptions}
              placeholder={skillOptions.length ? "Sélectionner" : "Aucune matière enregistrée"}
              disabled={skillOptions.length === 0}
              onSelect={(option) => {
                setSkillOption(option);
                setLevelOption(null);
              }}
            />
            <SelectField
              label="Niveau"
              value={levelOption}
              options={levelOptions}
              placeholder={skillOption ? "Sélectionner" : "Choisissez d'abord une matière"}
              disabled={!skillOption}
              onSelect={setLevelOption}
            />
          </>
        )}

        <View className="mb-[14px]">
          <Text className="mb-[6px] ml-0.5 text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Une introduction concrète à Python…"
            placeholderTextColor="#9799AF"
            multiline
            textAlignVertical="top"
            className="h-[90px] rounded-sm border border-line bg-surface px-[14px] py-[13px] text-[15px] text-ink"
            accessibilityLabel="Description de l'offre"
          />
        </View>

        <SelectField label="Durée" value={duration} options={DURATION_OPTIONS} onSelect={(option) => setDuration(option as typeof duration)} />

        <TextField
          label="Prix (Ar)"
          value={price}
          onChangeText={setPrice}
          placeholder="25000"
          keyboardType="numeric"
        />
      </ScrollView>

      <View className="border-t border-line-soft bg-surface px-5 pt-4" style={{ paddingBottom: Math.max(insetsBottom, 22) }}>
        <View className="gap-[10px]">
          <Button
            label="Enregistrer"
            disabled={!canSubmit || isSaving || isToggling}
            loading={isSaving}
            loadingLabel="Enregistrement..."
            onPress={handleSubmit}
          />
          {existingOffer ? (
            <Button
              label={existingOffer.isActive ? "Désactiver l'offre" : "Réactiver l'offre"}
              variant="ghost"
              disabled={isSaving || isToggling}
              loading={isToggling}
              loadingLabel="Mise à jour..."
              onPress={() => onToggleStatus(existingOffer.id, !existingOffer.isActive)}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-[14px]">
      <Text className="mb-[6px] ml-0.5 text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">{label}</Text>
      <View className="rounded-sm border border-line bg-surface px-[14px] py-[13px]">
        <Text className="text-[15px] text-ink-faint">{value}</Text>
      </View>
    </View>
  );
}

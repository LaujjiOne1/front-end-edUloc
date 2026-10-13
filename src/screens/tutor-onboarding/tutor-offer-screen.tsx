import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlusIcon, TrashIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { StepProgress } from "@/components/ui/step-progress";
import { TextField } from "@/components/ui/text-field";
import { priceLabel } from "@/api/format/datetime";
import { DEFAULT_HOURLY_RATE, type OfferDuration, useTutorApplicationStore } from "@/store/tutor-application.store";

/** 20000 → « 20 000 Ar » */
const ar = (amount: number) => priceLabel({ amount: String(amount), currency: "MGA" });

const TUTOR_FORMAT_ROUTE = "/tutor-format" as Href;
const TUTOR_SKILLS_ROUTE = "/tutor-skills" as Href;
const TOTAL_STEPS = 9;

const DURATION_OPTIONS: OfferDuration[] = [
  { id: "45m", label: "45 minutes", hours: 0.75 },
  { id: "1h", label: "1 heure", hours: 1 },
  { id: "1h30", label: "1 heure 30", hours: 1.5 },
  { id: "2h", label: "2 heures", hours: 2 },
  { id: "3h", label: "3 heures", hours: 3 },
];

export function TutorOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const skills = useTutorApplicationStore((s) => s.skills);
  const subjectLevels = useTutorApplicationStore((s) => s.subjectLevels);
  const offers = useTutorApplicationStore((s) => s.offers);
  const activeOfferIndex = useTutorApplicationStore((s) => s.activeOfferIndex);
  const setActiveOfferIndex = useTutorApplicationStore((s) => s.setActiveOfferIndex);
  const updateOfferAtIndex = useTutorApplicationStore((s) => s.updateOfferAtIndex);
  const addNewOffer = useTutorApplicationStore((s) => s.addNewOffer);
  const removeOfferAtIndex = useTutorApplicationStore((s) => s.removeOfferAtIndex);

  // Current active offer
  const currentOffer = offers[activeOfferIndex] ?? offers[0];

  useEffect(() => {
    if (skills.length === 0) router.replace(TUTOR_SKILLS_ROUTE);
  }, [skills.length, router]);

  if (skills.length === 0 || !currentOffer) return null;

  const availableLevels = subjectLevels.find((sl) => sl.skill.id === currentOffer.skill?.id)?.levels ?? [];

  const hours = currentOffer.duration?.hours ?? 1;
  const hourlyRate = currentOffer.hourlyRate || DEFAULT_HOURLY_RATE;
  const calculatedPrice = Math.round(hourlyRate * hours);

  const canContinue = offers.every(
    (o) =>
      !!o.skill &&
      !!o.level &&
      o.title.trim().length > 0 &&
      o.description.trim().length > 0 &&
      !!o.duration &&
      o.hourlyRate > 0,
  );

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
          <Text className="mb-1 text-[24px] font-bold text-ink">Que proposez-vous&nbsp;?</Text>
          <Text className="mb-4 text-[13.5px] text-ink-soft">
            Créez une ou plusieurs offres adaptées à vos élèves avec tarification dynamique
          </Text>
        </FadeIn>

        {/* Sélecteur d'onglets pour plusieurs offres */}
        <FadeIn delay={70}>
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {offers.map((o, idx) => {
                const isActive = idx === activeOfferIndex;
                const label = o.title.trim() ? o.title.slice(0, 16) : `Offre ${idx + 1}`;
                return (
                  <PressableScale
                    key={o.id || idx}
                    onPress={() => setActiveOfferIndex(idx)}
                    accessibilityLabel={`Basculer sur ${label}`}
                  >
                    <View
                      className={[
                        "flex-row items-center gap-1.5 rounded-full px-4 py-2 border",
                        isActive
                          ? "border-primary bg-primary text-white"
                          : "border-line bg-surface text-ink",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "text-[13px] font-bold",
                          isActive ? "text-white" : "text-ink",
                        ].join(" ")}
                      >
                        {label}
                      </Text>
                      {offers.length > 1 && isActive ? (
                        <PressableScale
                          onPress={() => removeOfferAtIndex(idx)}
                          accessibilityLabel="Supprimer cette offre"
                        >
                          <View className="ml-1">
                            <TrashIcon size={13} color="#fff" />
                          </View>
                        </PressableScale>
                      ) : null}
                    </View>
                  </PressableScale>
                );
              })}

              <PressableScale onPress={addNewOffer} accessibilityLabel="Ajouter une autre offre">
                <View className="flex-row items-center gap-1 rounded-full border border-dashed border-primary bg-primary-tint/30 px-3.5 py-2">
                  <PlusIcon size={14} color="#332E86" />
                  <Text className="text-[12.5px] font-bold text-primary">+ Nouvelle offre</Text>
                </View>
              </PressableScale>
            </ScrollView>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View className="rounded-xl border border-line bg-surface p-4">
            <View className="mb-3 flex-row items-center justify-between border-b border-line-soft pb-2.5">
              <Text className="text-[14.5px] font-bold text-primary">
                Configuration de l&apos;offre #{activeOfferIndex + 1}
              </Text>
              <Text className="text-[12px] font-semibold text-ink-soft">
                {offers.length} offre{offers.length > 1 ? "s" : ""} au total
              </Text>
            </View>

            <SelectField
              label="Matière"
              value={currentOffer.skill}
              options={skills}
              onSelect={(option) => {
                const skill = skills.find((s) => s.id === option.id) ?? null;
                updateOfferAtIndex(activeOfferIndex, { skill, level: null });
              }}
            />

            <SelectField
              label="Niveau"
              value={currentOffer.level}
              options={availableLevels}
              placeholder={currentOffer.skill ? "Sélectionner" : "Choisissez d'abord une matière"}
              disabled={!currentOffer.skill}
              onSelect={(option) => {
                const level = availableLevels.find((l) => l.id === option.id) ?? null;
                updateOfferAtIndex(activeOfferIndex, { level });
              }}
            />

            <TextField
              label="Titre de l'offre"
              value={currentOffer.title}
              onChangeText={(title) => updateOfferAtIndex(activeOfferIndex, { title })}
              placeholder="Ex: Soutien Python & préparation TP"
            />

            <View className="mb-[14px]">
              <Text className="mb-[6px] ml-0.5 text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">
                Description
              </Text>
              <TextInput
                value={currentOffer.description}
                onChangeText={(description) => updateOfferAtIndex(activeOfferIndex, { description })}
                placeholder="Décrivez le contenu de la séance, votre méthode pédagogique…"
                placeholderTextColor="#9799AF"
                multiline
                textAlignVertical="top"
                className="h-[80px] rounded-lg border border-line bg-paper px-[14px] py-[10px] text-[14.5px] text-ink"
                accessibilityLabel="Description de l'offre"
              />
            </View>

            <SelectField
              label="Durée par séance"
              value={currentOffer.duration}
              options={DURATION_OPTIONS}
              onSelect={(option) => {
                const duration = DURATION_OPTIONS.find((d) => d.id === option.id) ?? null;
                updateOfferAtIndex(activeOfferIndex, { duration });
              }}
            />

            {/* Champ de tarification dynamique basé sur le taux horaire */}
            <View className="mt-2 rounded-lg border border-primary/30 bg-primary-tint/20 p-3.5">
              <Text className="mb-1 text-[12.5px] font-bold text-primary">
                Tarification horaire & calcul automatique
              </Text>

              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-[11.5px] text-ink-soft">Prix par heure (Ar / h)</Text>
                  <TextInput
                    value={String(currentOffer.hourlyRate || "")}
                    onChangeText={(val) => {
                      const num = parseInt(val.replace(/\D/g, ""), 10) || 0;
                      updateOfferAtIndex(activeOfferIndex, { hourlyRate: num });
                    }}
                    keyboardType="number-pad"
                    placeholder="20000"
                    placeholderTextColor="#9799AF"
                    className="h-10 rounded-md border border-line bg-surface px-3 text-[15px] font-bold text-ink"
                  />
                </View>

                <View className="flex-1 items-end justify-center pt-3">
                  <Text className="text-[11.5px] text-ink-soft">Prix par séance calculé</Text>
                  <Text className="text-[20px] font-extrabold text-accent">
                    {ar(calculatedPrice)}{" "}
                    <Text className="text-[12px] font-normal text-ink-soft">
                      / {currentOffer.duration?.label ?? "1h"}
                    </Text>
                  </Text>
                </View>
              </View>

              <Text className="mt-2 text-[11px] text-ink-faint">
                💡 Calculé automatiquement : {ar(hourlyRate)}/h × {hours}h = {ar(calculatedPrice)} par cours.
              </Text>
            </View>
          </View>
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label={`Continuer (${offers.length} offre${offers.length > 1 ? "s" : ""})`}
          disabled={!canContinue}
          onPress={() => router.push(TUTOR_FORMAT_ROUTE)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

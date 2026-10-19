import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isApiError } from "@/api/errors";
import { CrosshairIcon, HouseIcon, LocationIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { PlaceSearchField } from "@/components/ui/place-search-field";
import { StepProgress } from "@/components/ui/step-progress";
import { LocationService, type ResolvedLocation } from "@/services/location.service";
import { useTutorApplicationStore } from "@/store/tutor-application.store";

const TUTOR_AVAILABILITY_ROUTE = "/tutor-availability" as Href;
const TOTAL_STEPS = 9;

const RADIUS_OPTIONS = [5, 10, 15, 20, 30];

/**
 * Lieux d'intervention du tuteur, selon les façons d'enseigner en présentiel choisies à l'étape précédente.
 * Chaque lieu est une adresse GÉOCODÉE (coordonnées réelles) : la recherche des demandeurs est géographique,
 * un lieu sans coordonnées ne serait jamais trouvé.
 *  - « Je me déplace chez l'élève » : une zone et son rayon d'activité ;
 *  - « J'accueille chez moi » : l'adresse d'accueil ;
 *  - « Lieu public » : un ou plusieurs points de rencontre (bibliothèque, campus…).
 */
export function TutorLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inPersonModes = useTutorApplicationStore((s) => s.inPersonModes);
  const locations = useTutorApplicationStore((s) => s.locations);
  const setTravelZone = useTutorApplicationStore((s) => s.setTravelZone);
  const updateTravelRadius = useTutorApplicationStore((s) => s.updateTravelRadius);
  const setTutorHome = useTutorApplicationStore((s) => s.setTutorHome);
  const addPublicPlace = useTutorApplicationStore((s) => s.addPublicPlace);
  const removeLocation = useTutorApplicationStore((s) => s.removeLocation);

  const travel = inPersonModes.includes("beneficiary_home");
  const hosting = inPersonModes.includes("tutor_home");
  const publicPlaces = inPersonModes.includes("public_place");

  const travelZone = locations.find((l) => l.kind === "beneficiary_home");
  const tutorHome = locations.find((l) => l.kind === "tutor_home");
  const meetingPlaces = locations.filter((l) => l.kind === "public_place");

  const [editingTravel, setEditingTravel] = useState(false);
  const [editingHome, setEditingHome] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pickedPlace, setPickedPlace] = useState<ResolvedLocation | null>(null);
  const [newRadius, setNewRadius] = useState(10);

  const chooseTravelZone = (place: ResolvedLocation) => {
    setTravelZone(place.label, { latitude: place.latitude, longitude: place.longitude });
    setEditingTravel(false);
    setLocateError(null);
  };

  const chooseTutorHome = (place: ResolvedLocation) => {
    setTutorHome(place.label, { latitude: place.latitude, longitude: place.longitude });
    setEditingHome(false);
  };

  const useMyPosition = async () => {
    if (isLocating) return;
    setLocateError(null);
    setIsLocating(true);
    try {
      chooseTravelZone(await LocationService.getCurrentPosition());
    } catch (error) {
      setLocateError(isApiError(error) ? error.message : "Impossible de récupérer votre position.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleAddPublicPlace = () => {
    if (!pickedPlace) return;
    addPublicPlace(pickedPlace.label, newRadius, { latitude: pickedPlace.latitude, longitude: pickedPlace.longitude });
    setPickedPlace(null);
    setNewRadius(10);
    setIsAddModalOpen(false);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setPickedPlace(null);
  };

  const missing: string[] = [];
  if (travel && !travelZone) missing.push("votre zone de déplacement");
  if (hosting && !tutorHome) missing.push("votre adresse d'accueil");
  if (publicPlaces && meetingPlaces.length === 0) missing.push("au moins un lieu public");
  const canContinue = missing.length === 0;

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={8} total={TOTAL_STEPS} title="Lieux & Rayons d'activité" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Vos lieux d&apos;intervention</Text>
          <Text className="mb-4 text-[13.5px] text-ink-soft">
            {inPersonModes.length === 0
              ? "Vous enseignez uniquement en ligne : aucun lieu à renseigner."
              : "Renseignez les lieux correspondant à vos façons d'enseigner en présentiel"}
          </Text>
        </FadeIn>

        {/* Je me déplace chez l'élève */}
        {travel ? (
          <FadeIn delay={80}>
            {travelZone && !editingTravel ? (
              <View className="mb-4 rounded-xl border border-primary/40 bg-surface p-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <LocationIcon size={16} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-ink">{travelZone.label}</Text>
                    <Text className="text-[12px] font-semibold text-primary">Zone de déplacement chez l&apos;élève</Text>
                  </View>
                  <PressableScale onPress={() => setEditingTravel(true)} accessibilityLabel="Modifier la zone de déplacement">
                    <Text className="text-[13px] font-bold text-primary">Modifier</Text>
                  </PressableScale>
                </View>

                <View className="mt-3.5 border-t border-line-soft pt-3">
                  <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[0.03em] text-ink-soft">
                    Rayon d&apos;activité autour du lieu : {travelZone.radiusKm} km
                  </Text>
                  <View className="flex-row gap-2">
                    {RADIUS_OPTIONS.map((km) => {
                      const isSelected = travelZone.radiusKm === km;
                      return (
                        <PressableScale key={km} onPress={() => updateTravelRadius(km)} accessibilityLabel={`${km} km`}>
                          <View
                            className={[
                              "items-center justify-center rounded-lg border px-3 py-1.5",
                              isSelected ? "border-primary bg-primary" : "border-line bg-paper",
                            ].join(" ")}
                          >
                            <Text className={["text-[12.5px] font-bold", isSelected ? "text-white" : "text-ink"].join(" ")}>{km} km</Text>
                          </View>
                        </PressableScale>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : (
              <View className="mb-4 rounded-xl border border-primary/40 bg-surface p-4">
                <Text className="mb-1 text-[15px] font-bold text-ink">Votre zone de déplacement</Text>
                <Text className="mb-3 text-[12.5px] text-ink-soft">
                  Le quartier ou la ville autour de laquelle vous vous déplacez chez vos élèves.
                </Text>

                <PressableScale onPress={useMyPosition} disabled={isLocating} accessibilityLabel="Utiliser ma position">
                  <View className="mb-3 flex-row items-center gap-3 rounded-lg border border-line bg-paper p-3">
                    {isLocating ? <ActivityIndicator size="small" color="#332E86" /> : <CrosshairIcon size={18} color="#332E86" />}
                    <Text className="flex-1 text-[14px] font-semibold text-ink">
                      {isLocating ? "Localisation en cours..." : "Utiliser ma position"}
                    </Text>
                  </View>
                </PressableScale>
                {locateError ? <Text className="mb-3 text-[12.5px] text-error">{locateError}</Text> : null}

                <PlaceSearchField placeholder="Quartier, adresse, ville..." onSelect={chooseTravelZone} />

                {travelZone ? (
                  <PressableScale onPress={() => setEditingTravel(false)} accessibilityLabel="Annuler la modification">
                    <Text className="mt-3 text-center text-[13px] font-semibold text-ink-soft">Annuler</Text>
                  </PressableScale>
                ) : null}
              </View>
            )}
          </FadeIn>
        ) : null}

        {/* J'accueille chez moi */}
        {hosting ? (
          <FadeIn delay={100}>
            {tutorHome && !editingHome ? (
              <View className="mb-4 rounded-xl border border-primary/40 bg-surface p-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <HouseIcon size={16} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-ink">{tutorHome.label}</Text>
                    <Text className="text-[12px] font-semibold text-primary">Adresse d&apos;accueil</Text>
                  </View>
                  <PressableScale onPress={() => setEditingHome(true)} accessibilityLabel="Modifier l'adresse d'accueil">
                    <Text className="text-[13px] font-bold text-primary">Modifier</Text>
                  </PressableScale>
                </View>
              </View>
            ) : (
              <View className="mb-4 rounded-xl border border-primary/40 bg-surface p-4">
                <Text className="mb-1 text-[15px] font-bold text-ink">Votre adresse d&apos;accueil</Text>
                <Text className="mb-3 text-[12.5px] text-ink-soft">
                  Là où vous recevez vos élèves. Elle n&apos;est communiquée qu&apos;une fois la réservation confirmée.
                </Text>
                <PlaceSearchField placeholder="Votre adresse, quartier..." onSelect={chooseTutorHome} />
                {tutorHome ? (
                  <PressableScale onPress={() => setEditingHome(false)} accessibilityLabel="Annuler la modification">
                    <Text className="mt-3 text-center text-[13px] font-semibold text-ink-soft">Annuler</Text>
                  </PressableScale>
                ) : null}
              </View>
            )}
          </FadeIn>
        ) : null}

        {/* Lieux publics */}
        {publicPlaces ? (
          <FadeIn delay={120}>
            <Text className="mb-2.5 text-[14px] font-bold text-ink">Lieux publics ({meetingPlaces.length})</Text>

            {meetingPlaces.length === 0 ? (
              <View className="mb-3 rounded-lg border border-dashed border-line bg-surface/60 p-4">
                <Text className="text-center text-[13px] text-ink-soft">
                  Aucun lieu public ajouté. Par exemple une bibliothèque, un campus ou un tiers-lieu.
                </Text>
              </View>
            ) : (
              <View className="mb-3 gap-2.5">
                {meetingPlaces.map((loc) => (
                  <View key={loc.id} className="flex-row items-center gap-3 rounded-lg border border-line bg-surface p-3.5">
                    <View className="h-9 w-9 items-center justify-center rounded-md bg-paper-alt">
                      <LocationIcon size={16} color="#585B78" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14.5px] font-bold text-ink">{loc.label}</Text>
                      <Text className="text-[12px] text-ink-soft">Rayon dédié : {loc.radiusKm} km</Text>
                    </View>
                    <PressableScale onPress={() => removeLocation(loc.id)} accessibilityLabel={`Supprimer ${loc.label}`}>
                      <View className="p-1">
                        <TrashIcon size={16} color="#E04F5F" />
                      </View>
                    </PressableScale>
                  </View>
                ))}
              </View>
            )}

            <PressableScale onPress={() => setIsAddModalOpen(true)} accessibilityLabel="Ajouter un lieu public">
              <View className="flex-row items-center gap-2 rounded-lg border border-dashed border-primary bg-primary-tint/30 p-3.5">
                <PlusIcon size={17} color="#332E86" />
                <Text className="text-[14px] font-bold text-primary">Ajouter un lieu public</Text>
              </View>
            </PressableScale>
          </FadeIn>
        ) : null}
      </ScrollView>

      {/* Modal ajout d'un lieu public */}
      <Modal visible={isAddModalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-2xl bg-surface p-5" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-ink">Nouveau lieu public</Text>
              <PressableScale onPress={closeModal} accessibilityLabel="Fermer">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-paper">
                  <XIcon size={16} color="#585B78" />
                </View>
              </PressableScale>
            </View>

            <Text className="mb-1 text-[12.5px] font-semibold text-ink-soft">Adresse ou nom du lieu *</Text>
            <View className="mb-4">
              <PlaceSearchField placeholder="Ex : Médiathèque 67 Ha, Antananarivo" onSelect={setPickedPlace} />
            </View>
            {pickedPlace ? (
              <Text className="mb-4 text-[12.5px] font-semibold text-accent" numberOfLines={2}>
                Lieu retenu : {pickedPlace.label}
              </Text>
            ) : null}

            <Text className="mb-2 text-[12.5px] font-semibold text-ink-soft">Rayon d&apos;activité dédié ({newRadius} km)</Text>
            <View className="mb-5 flex-row gap-2">
              {RADIUS_OPTIONS.map((km) => (
                <PressableScale key={km} onPress={() => setNewRadius(km)} accessibilityLabel={`${km} km`}>
                  <View className={["rounded-lg border px-3 py-1.5", newRadius === km ? "border-primary bg-primary" : "border-line bg-paper"].join(" ")}>
                    <Text className={["text-[12.5px] font-bold", newRadius === km ? "text-white" : "text-ink"].join(" ")}>{km} km</Text>
                  </View>
                </PressableScale>
              ))}
            </View>

            <Button label="Ajouter ce lieu" disabled={!pickedPlace} onPress={handleAddPublicPlace} />
          </View>
        </View>
      </Modal>

      <View className="border-t border-line-soft bg-surface px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 22) }}>
        {!canContinue ? (
          <Text className="mb-3 text-center text-[12.5px] text-ink-soft">Renseignez {missing.join(", ")} pour continuer.</Text>
        ) : null}
        <Button label="Continuer" disabled={!canContinue} onPress={() => router.push(TUTOR_AVAILABILITY_ROUTE)} />
      </View>
    </View>
  );
}

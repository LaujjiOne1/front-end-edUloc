import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isApiError } from "@/api/errors";
import { CrosshairIcon, LocationIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";
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
 * Lieux d'intervention du tuteur. Chaque lieu est une adresse GÉOCODÉE (coordonnées réelles) :
 * la recherche des demandeurs est géographique, un lieu sans coordonnées ne serait jamais trouvé.
 * Zone principale = le tuteur se déplace chez l'élève dans le rayon choisi ; lieux secondaires =
 * points de rencontre (bibliothèque, campus…).
 */
export function TutorLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locations = useTutorApplicationStore((s) => s.locations);
  const setPrimaryLocation = useTutorApplicationStore((s) => s.setPrimaryLocation);
  const updatePrimaryRadius = useTutorApplicationStore((s) => s.updatePrimaryRadius);
  const addSecondaryLocation = useTutorApplicationStore((s) => s.addSecondaryLocation);
  const removeLocation = useTutorApplicationStore((s) => s.removeLocation);

  const primaryLocation = locations.find((l) => l.isPrimary);
  const secondaryLocations = locations.filter((l) => !l.isPrimary);

  const [editingPrimary, setEditingPrimary] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pickedPlace, setPickedPlace] = useState<ResolvedLocation | null>(null);
  const [newRadius, setNewRadius] = useState(10);

  const choosePrimary = (place: ResolvedLocation) => {
    setPrimaryLocation(place.label, { latitude: place.latitude, longitude: place.longitude });
    setEditingPrimary(false);
    setLocateError(null);
  };

  const useMyPosition = async () => {
    if (isLocating) return;
    setLocateError(null);
    setIsLocating(true);
    try {
      choosePrimary(await LocationService.getCurrentPosition());
    } catch (error) {
      setLocateError(isApiError(error) ? error.message : "Impossible de récupérer votre position.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleAddSecondary = () => {
    if (!pickedPlace) return;
    addSecondaryLocation(pickedPlace.label, newRadius, { latitude: pickedPlace.latitude, longitude: pickedPlace.longitude });
    setPickedPlace(null);
    setNewRadius(10);
    setIsAddModalOpen(false);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setPickedPlace(null);
  };

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
            Définissez votre zone principale et vos lieux secondaires avec leur rayon d&apos;activité
          </Text>
        </FadeIn>

        {/* Lieu principal */}
        <FadeIn delay={80}>
          {primaryLocation && !editingPrimary ? (
            <View className="mb-4 rounded-xl border border-primary/40 bg-surface p-4">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <LocationIcon size={16} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-ink">{primaryLocation.label}</Text>
                  <Text className="text-[12px] font-semibold text-primary">Position principale</Text>
                </View>
                <PressableScale onPress={() => setEditingPrimary(true)} accessibilityLabel="Modifier la position principale">
                  <Text className="text-[13px] font-bold text-primary">Modifier</Text>
                </PressableScale>
              </View>

              {/* Sélection du rayon d'activité */}
              <View className="mt-3.5 border-t border-line-soft pt-3">
                <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[0.03em] text-ink-soft">
                  Rayon d&apos;activité autour du lieu : {primaryLocation.radiusKm} km
                </Text>
                <View className="flex-row gap-2">
                  {RADIUS_OPTIONS.map((km) => {
                    const isSelected = primaryLocation.radiusKm === km;
                    return (
                      <PressableScale key={km} onPress={() => updatePrimaryRadius(km)} accessibilityLabel={`${km} km`}>
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
              <Text className="mb-1 text-[15px] font-bold text-ink">Votre zone principale</Text>
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

              <PlaceSearchField placeholder="Quartier, adresse, ville..." onSelect={choosePrimary} />

              {primaryLocation ? (
                <PressableScale onPress={() => setEditingPrimary(false)} accessibilityLabel="Annuler la modification">
                  <Text className="mt-3 text-center text-[13px] font-semibold text-ink-soft">Annuler</Text>
                </PressableScale>
              ) : null}
            </View>
          )}
        </FadeIn>

        {/* Lieux secondaires */}
        <FadeIn delay={120}>
          <Text className="mb-2.5 text-[14px] font-bold text-ink">Lieux secondaires ({secondaryLocations.length})</Text>

          {secondaryLocations.length === 0 ? (
            <View className="mb-3 rounded-lg border border-dashed border-line bg-surface/60 p-4">
              <Text className="text-center text-[13px] text-ink-soft">
                Aucun lieu secondaire ajouté. Vous pouvez par exemple ajouter une bibliothèque, un campus ou un tiers-lieu.
              </Text>
            </View>
          ) : (
            <View className="mb-3 gap-2.5">
              {secondaryLocations.map((loc) => (
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

          <PressableScale onPress={() => setIsAddModalOpen(true)} accessibilityLabel="Ajouter un lieu secondaire">
            <View className="flex-row items-center gap-2 rounded-lg border border-dashed border-primary bg-primary-tint/30 p-3.5">
              <PlusIcon size={17} color="#332E86" />
              <Text className="text-[14px] font-bold text-primary">Ajouter un lieu secondaire</Text>
            </View>
          </PressableScale>
        </FadeIn>
      </ScrollView>

      {/* Modal Ajout Lieu Secondaire */}
      <Modal visible={isAddModalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-2xl bg-surface p-5" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-ink">Nouveau lieu secondaire</Text>
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

            <Button label="Ajouter ce lieu" disabled={!pickedPlace} onPress={handleAddSecondary} />
          </View>
        </View>
      </Modal>

      <View className="border-t border-line-soft bg-surface px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 22) }}>
        {!primaryLocation ? (
          <Text className="mb-3 text-center text-[12.5px] text-ink-soft">Choisissez votre zone principale pour continuer.</Text>
        ) : null}
        <Button label="Continuer" disabled={!primaryLocation} onPress={() => router.push(TUTOR_AVAILABILITY_ROUTE)} />
      </View>
    </View>
  );
}

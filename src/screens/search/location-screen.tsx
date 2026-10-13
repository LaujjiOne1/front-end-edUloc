import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronRightIcon, CrosshairIcon, SearchIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { RadioCard } from "@/components/ui/selectable-card";
import { StepProgress } from "@/components/ui/step-progress";
import { type LocationFormatsState, useLocationFormats } from "@/hooks/use-location-formats";
import { LocationService, LocationServiceError } from "@/services/location.service";
import { useSearchWizardStore } from "@/store/search-wizard.store";
import type { LocationFormatId } from "@/types/common";

const OBJECTIVE_ROUTE = "/search/objective" as Href;
const SUMMARY_ROUTE = "/search/summary" as Href;

export function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { state: formatsState, retry: retryFormats } = useLocationFormats();

  const location = useSearchWizardStore((s) => s.criteria.location);
  const setLocationQuery = useSearchWizardStore((s) => s.setLocationQuery);
  const setCurrentPositionLabel = useSearchWizardStore((s) => s.setCurrentPositionLabel);
  const setGeocodedLocation = useSearchWizardStore((s) => s.setGeocodedLocation);
  const setLocationFormat = useSearchWizardStore((s) => s.setLocationFormat);

  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  const useMyPosition = async () => {
    if (isLocating || isNavigating) return;
    setLocationError(null);
    setIsLocating(true);
    try {
      const position = await LocationService.getCurrentPosition();
      setCurrentPositionLabel(position.label, { latitude: position.latitude, longitude: position.longitude });
      setIsNavigating(true);
      if (from === "summary") {
        router.push(SUMMARY_ROUTE);
      } else {
        router.push(OBJECTIVE_ROUTE);
      }
    } catch (error) {
      setLocationError(
        error instanceof LocationServiceError ? error.message : "Impossible de récupérer votre position.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  const isOnlineOnly = location.format === "online";
  const hasLocation = location.coordinates !== null || location.query.trim().length > 0;
  const canContinue = (isOnlineOnly || hasLocation) && !isNavigating && !isLocating && !isResolving;

  const next = () => {
    setIsNavigating(true);
    router.push(from === "summary" ? SUMMARY_ROUTE : OBJECTIVE_ROUTE);
  };

  const continueToObjective = async () => {
    if (!canContinue) return;
    setLocationError(null);
    // Un cours 100 % en ligne n'a pas besoin de lieu ; sinon la recherche exige des coordonnées.
    if (isOnlineOnly || location.coordinates) return next();

    setIsResolving(true);
    try {
      const place = await LocationService.geocode(location.query);
      if (!place) {
        setLocationError("Adresse introuvable. Essayez un quartier ou une ville (ex. « Ankorondrano »).");
        return;
      }
      setGeocodedLocation(place.label, { latitude: place.latitude, longitude: place.longitude });
      next();
    } catch (error) {
      setLocationError(
        error instanceof LocationServiceError ? error.message : "Impossible de vérifier cette adresse. Réessayez.",
      );
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={4} total={7} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-5 text-[26px] font-bold text-ink">Où souhaitez-vous le cours&nbsp;?</Text>
        </FadeIn>

        <FadeIn delay={90}>
          <PressableScale
            onPress={useMyPosition}
            disabled={isLocating || isNavigating}
            accessibilityLabel="Utiliser ma position"
          >
            <View className="mb-3 flex-row items-center gap-3 rounded-lg border border-primary bg-surface p-4">
              <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-primary">
                {isLocating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <CrosshairIcon size={18} color="#fff" />
                )}
              </View>
              <Text className="flex-1 text-[15px] font-bold text-ink">
                {isLocating ? "Localisation en cours..." : "Utiliser ma position"}
              </Text>
              <ChevronRightIcon size={17} color="#9799AF" />
            </View>
          </PressableScale>
        </FadeIn>

        <FadeIn delay={120}>
          <Text className="my-[14px] text-center text-[12.5px] font-semibold text-ink-faint">OU</Text>
        </FadeIn>

        <FadeIn delay={150}>
          <View className="mb-6 flex-row items-center gap-[10px] rounded-sm border border-line bg-surface px-[14px] py-[13px]">
            <SearchIcon size={17} color="#9799AF" />
            <TextInput
              value={location.query}
              onChangeText={setLocationQuery}
              placeholder="Rechercher une adresse, un quartier..."
              placeholderTextColor="#9799AF"
              className="flex-1 text-[15px] text-ink"
              accessibilityLabel="Rechercher une adresse"
              editable={!isResolving}
              returnKeyType="search"
              onSubmitEditing={continueToObjective}
            />
          </View>
          {locationError ? <Text className="-mt-4 mb-5 text-[13px] text-error">{locationError}</Text> : null}
        </FadeIn>

        <FadeIn delay={190}>
          <Text className="mb-[6px] ml-0.5 text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">
            Format
          </Text>
          <FormatList
            state={formatsState}
            selectedId={location.format}
            onRetry={retryFormats}
            onSelect={setLocationFormat}
          />
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label="Continuer"
          loading={isResolving}
          loadingLabel="Vérification de l'adresse..."
          disabled={!canContinue && !isResolving}
          onPress={continueToObjective}
        />
      </View>
    </View>
  );
}

type FormatListProps = {
  state: LocationFormatsState;
  selectedId: LocationFormatId;
  onRetry: () => void;
  onSelect: (format: LocationFormatId) => void;
};

function FormatList({ state, selectedId, onRetry, onSelect }: FormatListProps) {
  if (state.status === "loading") {
    return (
      <View className="gap-[10px]">
        {[0, 1, 2].map((i) => (
          <View key={i} className="h-[54px] rounded-lg bg-line-soft" />
        ))}
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-[13.5px] text-error">{state.message}</Text>
        <PressableScale onPress={onRetry} accessibilityLabel="Réessayer de charger les formats">
          <Text className="text-[13.5px] font-semibold text-primary">Réessayer</Text>
        </PressableScale>
      </View>
    );
  }

  if (state.status === "empty") {
    return <Text className="text-[13.5px] text-ink-faint">Aucun format disponible pour le moment.</Text>;
  }

  return (
    <View className="gap-[10px]">
      {state.formats.map((format) => (
        <RadioCard
          key={format.id}
          label={format.label}
          selected={format.id === selectedId}
          onPress={() => onSelect(format.id)}
          variant="dot"
        />
      ))}
    </View>
  );
}

import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { ComponentType } from "react";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChildIcon, EditIcon, FamilyIcon, type IconProps, PersonIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { MenuCard } from "@/components/ui/selectable-card";
import { StepProgress } from "@/components/ui/step-progress";
import { type BeneficiaryTypesState, useBeneficiaryTypes } from "@/hooks/use-beneficiary-types";
import { useSearchWizardStore } from "@/store/search-wizard.store";
import type { BeneficiaryType } from "@/types/search";

const LOCATION_ROUTE = "/search/location" as Href;
const SUMMARY_ROUTE = "/search/summary" as Href;

const BENEFICIARY_ICONS: Partial<Record<BeneficiaryType["id"], ComponentType<IconProps>>> = {
  self: PersonIcon,
  child: ChildIcon,
  relative: FamilyIcon,
  other: EditIcon,
};

export function ForWhomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { state, retry } = useBeneficiaryTypes();
  const setBeneficiary = useSearchWizardStore((s) => s.setBeneficiary);
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  const selectBeneficiary = (beneficiary: BeneficiaryType) => {
    if (isNavigating) return;
    setIsNavigating(true);
    setBeneficiary(beneficiary);
    if (from === "summary") {
      router.push(SUMMARY_ROUTE);
    } else {
      router.push(LOCATION_ROUTE);
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={3} total={7} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[26px] font-bold text-ink">Pour qui recherchez-vous&nbsp;?</Text>
          <Text className="mb-5 text-[14px] text-ink-soft">
            Le demandeur n&apos;est pas toujours le bénéficiaire
          </Text>
        </FadeIn>

        <BeneficiaryList state={state} onRetry={retry} onSelect={selectBeneficiary} disabled={isNavigating} />
      </ScrollView>
    </View>
  );
}

type BeneficiaryListProps = {
  state: BeneficiaryTypesState;
  onRetry: () => void;
  onSelect: (beneficiary: BeneficiaryType) => void;
  disabled: boolean;
};

function BeneficiaryList({ state, onRetry, onSelect, disabled }: BeneficiaryListProps) {
  if (state.status === "loading") {
    return (
      <View className="gap-[10px]">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className="h-[76px] rounded-lg bg-line-soft" />
        ))}
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-[13.5px] text-error">{state.message}</Text>
        <PressableScale onPress={onRetry} accessibilityLabel="Réessayer de charger les options">
          <Text className="text-[13.5px] font-semibold text-primary">Réessayer</Text>
        </PressableScale>
      </View>
    );
  }

  if (state.status === "empty") {
    return <Text className="text-[13.5px] text-ink-faint">Aucune option disponible pour le moment.</Text>;
  }

  return (
    <View className="gap-[10px]">
      {state.beneficiaryTypes.map((beneficiary, index) => {
        const Icon = BENEFICIARY_ICONS[beneficiary.id] ?? PersonIcon;
        return (
          <FadeIn key={beneficiary.id} delay={100 + index * 40}>
            <MenuCard
              icon={<Icon size={21} color="#8D7FE3" />}
              title={beneficiary.label}
              description={beneficiary.description ?? undefined}
              iconTone="violet"
              iconSize="md"
              onPress={() => onSelect(beneficiary)}
              disabled={disabled}
            />
          </FadeIn>
        );
      })}
    </View>
  );
}

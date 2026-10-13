import { type Href, useFocusEffect, useRouter } from "expo-router";
import type { ComponentType } from "react";
import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ChildIcon,
  EditIcon,
  FamilyIcon,
  FinanceIcon,
  GraduationCapIcon,
  HouseIcon,
  type IconProps,
  LanguagesIcon,
  LevelIcon,
  LocationIcon,
  MicIcon,
  PersonIcon,
  ScienceIcon,
  SearchIcon,
  SubjectIcon,
  TeachIcon,
  VideoIcon,
  XIcon,
} from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { StepProgress } from "@/components/ui/step-progress";
import { useSearchWizardStore } from "@/store/search-wizard.store";
import type { LocationFormatId } from "@/types/common";

const RESULTS_ROUTE = "/results" as Href;

const SUBJECT_ICONS: Record<string, ComponentType<IconProps>> = {
  programming: SubjectIcon,
  math: LevelIcon,
  languages: LanguagesIcon,
  finance: FinanceIcon,
  sciences: ScienceIcon,
  methodology: GraduationCapIcon,
};

const FORMAT_LABELS: Record<LocationFormatId, { label: string; icon: ComponentType<IconProps> }> = {
  in_person: { label: "En présentiel (à domicile)", icon: HouseIcon },
  online: { label: "En ligne (visio)", icon: VideoIcon },
  both: { label: "En présentiel et en ligne", icon: LocationIcon },
};

type SummarySection = {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  route: Href;
  icon: ComponentType<IconProps>;
  iconBg: string;
  iconColor: string;
};

export function SearchSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const criteria = useSearchWizardStore((s) => s.criteria);
  const reset = useSearchWizardStore((s) => s.reset);

  const [isNavigating, setIsNavigating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  // Subject info
  const subjectLabel = criteria.subject?.label ?? "Non renseigné";
  const SubjectIconComponent = criteria.subject?.id ? SUBJECT_ICONS[criteria.subject.id] ?? SubjectIcon : SubjectIcon;

  // Level info
  const levelLabel = criteria.level?.label ?? "Tous niveaux";

  // Beneficiary info
  const beneficiaryLabel = criteria.beneficiary?.label ?? "Pour moi-même";
  const BeneficiaryIconComponent =
    criteria.beneficiary?.id === "child"
      ? ChildIcon
      : criteria.beneficiary?.id === "relative"
        ? FamilyIcon
        : PersonIcon;

  // Location & Format info
  const locationText = criteria.location.useCurrentPosition
    ? "Ma position actuelle"
    : criteria.location.query.trim() || "Tous secteurs";
  const formatInfo = FORMAT_LABELS[criteria.location.format] ?? FORMAT_LABELS.in_person;
  const FormatIconComponent = formatInfo.icon;

  // Objective info
  const objectiveLabel = criteria.objective?.label ?? "Soutien régulier";

  // Detail info
  const detailNote = criteria.detail.note.trim()
    ? criteria.detail.note
    : "Aucune précision particulière";

  const sections: SummarySection[] = [
    {
      id: "subject",
      title: "Matière recherchée",
      value: subjectLabel,
      route: "/search?from=summary" as Href,
      icon: SubjectIconComponent,
      iconBg: "bg-primary-tint",
      iconColor: "#332E86",
    },
    {
      id: "level",
      title: "Niveau scolaire",
      value: levelLabel,
      route: "/search/level?from=summary" as Href,
      icon: LevelIcon,
      iconBg: "bg-accent-tint",
      iconColor: "#0E9C82",
    },
    {
      id: "for-whom",
      title: "Bénéficiaire",
      value: beneficiaryLabel,
      subtitle: criteria.beneficiary?.description ?? undefined,
      route: "/search/for-whom?from=summary" as Href,
      icon: BeneficiaryIconComponent,
      iconBg: "bg-violet-tint",
      iconColor: "#5848C2",
    },
    {
      id: "location",
      title: "Lieu & Format du cours",
      value: locationText,
      subtitle: formatInfo.label,
      route: "/search/location?from=summary" as Href,
      icon: FormatIconComponent,
      iconBg: "bg-primary-tint",
      iconColor: "#332E86",
    },
    {
      id: "objective",
      title: "Objectif pédagogique",
      value: objectiveLabel,
      route: "/search/objective?from=summary" as Href,
      icon: TeachIcon,
      iconBg: "bg-accent-tint",
      iconColor: "#0E9C82",
    },
    {
      id: "detail",
      title: "Précisions & Détails",
      value: detailNote,
      route: "/search/detail?from=summary" as Href,
      icon: MicIcon,
      iconBg: "bg-surface-tint",
      iconColor: "#606482",
    },
  ];

  const handleEditSection = (targetRoute: Href) => {
    setIsEditModalOpen(false);
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(targetRoute);
  };

  const handleLaunchSearch = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(RESULTS_ROUTE);
  };

  const handleResetSearch = () => {
    reset();
    router.replace("/search" as Href);
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={7} total={7} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[26px] font-bold text-ink">Récapitulatif de votre recherche</Text>
          <Text className="mb-5 text-[14px] text-ink-soft">
            Vérifiez attentivement vos critères ou modifiez-les avant de découvrir les tuteurs disponibles.
          </Text>
        </FadeIn>

        {/* Recap card container with individual sections */}
        <FadeIn delay={90}>
          <View className="overflow-hidden rounded-xl border border-line bg-surface">
            <View className="flex-row items-center justify-between border-b border-line-soft bg-surface-tint/50 px-4 py-3">
              <Text className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">
                Vos critères sélectionnés
              </Text>
              <PressableScale
                onPress={() => setIsEditModalOpen(true)}
                accessibilityLabel="Ouvrir le menu de modification"
              >
                <View className="flex-row items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1">
                  <EditIcon size={13} color="#332E86" />
                  <Text className="text-[12px] font-bold text-primary">Modifier tout</Text>
                </View>
              </PressableScale>
            </View>

            <View className="divide-y divide-line-soft">
              {sections.map((sec) => {
                const IconComponent = sec.icon;
                return (
                  <View key={sec.id} className="p-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 flex-row items-start gap-3">
                        <View
                          className={[
                            "mt-0.5 h-9 w-9 items-center justify-center rounded-lg",
                            sec.iconBg,
                          ].join(" ")}
                        >
                          <IconComponent size={18} color={sec.iconColor} />
                        </View>

                        <View className="flex-1">
                          <Text className="text-[11.5px] font-bold uppercase tracking-wider text-ink-soft">
                            {sec.title}
                          </Text>
                          <Text className="mt-0.5 text-[15px] font-bold text-ink">
                            {sec.value}
                          </Text>
                          {sec.subtitle ? (
                            <Text className="mt-0.5 text-[12.5px] text-ink-soft">
                              {sec.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Direct modifier button */}
                      <PressableScale
                        onPress={() => handleEditSection(sec.route)}
                        accessibilityLabel={`Modifier ${sec.title}`}
                      >
                        <View className="flex-row items-center gap-1 rounded-md border border-line bg-paper px-2.5 py-1.5 shadow-xs">
                          <EditIcon size={13} color="#332E86" />
                          <Text className="text-[12px] font-bold text-primary">Modifier</Text>
                        </View>
                      </PressableScale>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeIn>

        {/* Quick action bar */}
        <FadeIn delay={140}>
          <PressableScale onPress={() => setIsEditModalOpen(true)} accessibilityLabel="Modifier un critère">
            <View className="mt-3.5 flex-row items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface/70 py-3">
              <EditIcon size={15} color="#332E86" />
              <Text className="text-[13.5px] font-bold text-primary">
                Modifier un critère spécifique
              </Text>
            </View>
          </PressableScale>
        </FadeIn>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View
        className="border-t border-line-soft bg-surface px-5 pt-3.5"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <Button
          label="Lancer la recherche"
          icon={<SearchIcon size={17} color="#fff" />}
          disabled={isNavigating}
          onPress={handleLaunchSearch}
        />

        <PressableScale
          onPress={handleResetSearch}
          disabled={isNavigating}
          accessibilityLabel="Réinitialiser tous les critères"
        >
          <View className="mt-2.5 items-center py-1">
            <Text className="text-[12.5px] font-medium text-ink-soft underline">
              Recommencer la recherche à zéro
            </Text>
          </View>
        </PressableScale>
      </View>

      {/* Bottom Sheet Drawer for Quick Targeted Editing */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/45"
          onPress={() => setIsEditModalOpen(false)}
          accessibilityLabel="Fermer"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="max-h-[85vh] rounded-t-2xl bg-surface p-5"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <View className="mb-4 flex-row items-center justify-between border-b border-line-soft pb-3">
                <View>
                  <Text className="text-[17px] font-bold text-ink">Modifier un critère</Text>
                  <Text className="text-[12px] text-ink-soft">
                    Choisissez l&apos;élément à ajuster sans perdre vos autres critères
                  </Text>
                </View>
                <PressableScale
                  onPress={() => setIsEditModalOpen(false)}
                  accessibilityLabel="Fermer la fenêtre"
                >
                  <View className="rounded-full bg-paper p-1.5">
                    <XIcon size={16} color="#606482" />
                  </View>
                </PressableScale>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                <View className="gap-2.5">
                  {sections.map((sec) => {
                    const IconComponent = sec.icon;
                    return (
                      <PressableScale
                        key={sec.id}
                        onPress={() => handleEditSection(sec.route)}
                        accessibilityLabel={`Modifier ${sec.title}`}
                      >
                        <View className="flex-row items-center justify-between rounded-lg border border-line bg-paper p-3.5">
                          <View className="flex-1 flex-row items-center gap-3">
                            <View
                              className={[
                                "h-8 w-8 items-center justify-center rounded-md",
                                sec.iconBg,
                              ].join(" ")}
                            >
                              <IconComponent size={16} color={sec.iconColor} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-[12px] font-bold text-ink-soft">
                                {sec.title}
                              </Text>
                              <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>
                                {sec.value}
                              </Text>
                            </View>
                          </View>

                          <View className="flex-row items-center gap-1">
                            <Text className="text-[12.5px] font-bold text-primary">Modifier</Text>
                            <EditIcon size={14} color="#332E86" />
                          </View>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

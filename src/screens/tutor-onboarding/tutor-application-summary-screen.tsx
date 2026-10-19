import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckIcon, ChevronRightIcon, EditIcon, XIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { priceLabel } from "@/api/format/datetime";
import { useSubmitTutorApplication } from "@/hooks/use-submit-tutor-application";
import { useAuthStore } from "@/store/auth.store";
import { EXPERIENCE_AUDIENCES, EXPERIENCE_TYPES } from "@/lib/experience-types";
import { offerDescription, offerTitle } from "@/lib/offer-labels";
import { trackKindOf } from "@/lib/search-funnel";
import { useTutorApplicationStore } from "@/store/tutor-application.store";
import type { LocationFormatId } from "@/types/common";
import type { TutorApplicationSubmission } from "@/types/tutor-application";

/** "12/05/1997" -> "1997-05-12" (IsoDate) — identity.birthDate is captured as JJ/MM/AAAA. */
function toIsoDate(ddmmyyyy: string): string | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy.trim());
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

const TUTOR_IDENTITY_ROUTE = "/tutor-identity" as Href;
const TUTOR_PENDING_ROUTE = "/tutor-application-pending" as Href;
const TUTOR_APPLICATION_SUMMARY_ROUTE = "/tutor-application-summary" as Href;
const LOGIN_ROUTE = "/login" as Href;

type SectionTarget = {
  id: string;
  label: string;
  route: Href;
  done: boolean;
  summary: string;
};

export function TutorApplicationSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const identity = useTutorApplicationStore((s) => s.identity);
  const background = useTutorApplicationStore((s) => s.background);
  const skills = useTutorApplicationStore((s) => s.skills);
  const subjectLevels = useTutorApplicationStore((s) => s.subjectLevels);
  const bio = useTutorApplicationStore((s) => s.bio);
  const introVideo = useTutorApplicationStore((s) => s.introVideo);
  const allOffers = useTutorApplicationStore((s) => s.offers);
  // Seules les lignes de tarif cochées deviennent des offres.
  const offers = allOffers.filter((o) => o.enabled);
  const formats = useTutorApplicationStore((s) => s.formats);
  const locations = useTutorApplicationStore((s) => s.locations);
  const inPersonModes = useTutorApplicationStore((s) => s.inPersonModes);
  const weeklyAvailability = useTutorApplicationStore((s) => s.weeklyAvailability);
  const dateAvailability = useTutorApplicationStore((s) => s.dateAvailability);
  const documents = useTutorApplicationStore((s) => s.documents);
  const setApplication = useTutorApplicationStore((s) => s.setApplication);
  const setIsPendingValidation = useTutorApplicationStore((s) => s.setIsPendingValidation);
  const setActiveMode = useAuthStore((s) => s.setActiveMode);
  const setReturnTo = useAuthStore((s) => s.setReturnTo);
  const { state, submit } = useSubmitTutorApplication();

  // Defensive net: the session could have expired between the tutor-intro
  // gate and this final step (e.g. a long form-filling session) — send the
  // user to log back in instead of leaving them stuck on a generic "session
  // expired" banner with no way forward. Their filled-in data stays intact
  // in useTutorApplicationStore, untouched by this redirect.
  useEffect(() => {
    if (state.status === "error" && state.code === "unauthorized") {
      setReturnTo(TUTOR_APPLICATION_SUMMARY_ROUTE);
      router.push(LOGIN_ROUTE);
    }
  }, [state, router, setReturnTo]);

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Guard: reaching the recap without having started the wizard means there's
  // nothing to review — bounce back to the start.
  const hasContext = identity.firstName.trim().length > 0;
  useEffect(() => {
    if (!hasContext) router.replace(TUTOR_IDENTITY_ROUTE);
  }, [hasContext, router]);

  if (!hasContext) return null;

  const sections: SectionTarget[] = [
    {
      id: "identity",
      label: "Informations personnelles",
      route: "/tutor-identity" as Href,
      done: !!identity.firstName && !!identity.lastName,
      summary: `${identity.firstName} ${identity.lastName} • ${identity.email}`,
    },
    {
      id: "background",
      label: "Parcours & Expériences",
      route: "/tutor-background" as Href,
      done: !!background.degree,
      summary: `${background.degree?.label ?? "Diplôme"} • ${background.field || "Domaine"}${
        (background.experiences?.length ?? 0) > 0
          ? ` • ${background.experiences?.length} exp.`
          : ""
      }`,
    },
    {
      id: "skills",
      label: "Compétences & Matières",
      route: "/tutor-skills" as Href,
      done: skills.length > 0,
      summary: `${skills.length} compétence${skills.length > 1 ? "s" : ""} sélectionnée${skills.length > 1 ? "s" : ""}`,
    },
    {
      id: "offers",
      label: "Offres & Tarification",
      route: "/tutor-offer" as Href,
      done: offers.length > 0 && offers.every((o) => o.hourlyRate > 0),
      summary: offers.length
        ? `${offers.length} offre${offers.length > 1 ? "s" : ""} • dès ${priceLabel({ amount: String(Math.min(...offers.map((o) => o.hourlyRate))), currency: "MGA" })}/h`
        : "Aucune offre",
    },
    {
      id: "locations",
      label: "Lieux & Rayons d'activité",
      route: "/tutor-locations" as Href,
      done: locations.length > 0,
      summary: `${locations.length} lieu${locations.length > 1 ? "x" : ""} d'intervention`,
    },
    {
      id: "availability",
      label: "Disponibilités",
      route: "/tutor-availability" as Href,
      done: weeklyAvailability.some((d) => d.active && d.slots.length > 0) || dateAvailability.length > 0,
      summary: [
        `${weeklyAvailability.filter((d) => d.active).length} jours actifs par semaine`,
        dateAvailability.length > 0 ? `${dateAvailability.length} date${dateAvailability.length > 1 ? "s" : ""} précise${dateAvailability.length > 1 ? "s" : ""}` : null,
      ]
        .filter(Boolean)
        .join(" • "),
    },
    {
      id: "documents",
      label: "Documents justificatifs",
      route: "/tutor-documents" as Href,
      done: documents.some((d) => d.provided),
      summary: `${documents.filter((d) => d.provided).length} document${documents.filter((d) => d.provided).length > 1 ? "s" : ""} fourni${documents.filter((d) => d.provided).length > 1 ? "s" : ""}`,
    },
  ];

  const isSubmitting = state.status === "loading";

  // Ce que le serveur exige (voir TutorApplicationsService.submit) : on le dit AVANT l'envoi plutôt
  // que de laisser un dossier incomplet partir et revenir en erreur.
  // Chaque façon d'enseigner en présentiel choisie doit avoir son lieu (zone, adresse d'accueil, lieu public).
  const hasAllPlaces = inPersonModes.every((mode) => locations.some((l) => l.kind === mode));
  const needsPlaces = formats.includes("in_person");
  const hasValidOffer =
    offers.length > 0 &&
    offers.every((o) => !!o.skill && !!o.level && !!o.duration && o.hourlyRate > 0 && (trackKindOf(o.level) !== "serie" || !!o.track));
  const missing: string[] = [];
  if (skills.length === 0 || subjectLevels.every((sl) => sl.levels.length === 0)) missing.push("au moins une matière avec son niveau");
  if (!hasValidOffer) missing.push("au moins une offre complète");
  if (needsPlaces && (inPersonModes.length === 0 || !hasAllPlaces)) missing.push("vos lieux d'intervention");
  if (!introVideo) missing.push("votre vidéo de présentation");
  const canSubmit = missing.length === 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const dayIndexes: Record<string, number> = {
      sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    };
    const format =
      formats.length > 1 ? "both" : formats[0] ?? "both";
    // Une plage en présentiel est proposée pour chaque façon d'enseigner choisie (déplacement, accueil chez soi, lieu
    // public), chacune sur son lieu : le demandeur choisit ensuite où il veut le cours. Le tuteur peut affiner plage par
    // plage depuis « Mes disponibilités ».
    const inPersonPlaceIndexes = [
      ...new Set(inPersonModes.map((mode) => locations.findIndex((l) => l.kind === mode)).filter((i) => i >= 0)),
    ];
    const placeVariants = (slotFormat: LocationFormatId): { format: LocationFormatId; placeIndex: number | null }[] => [
      ...(slotFormat !== "in_person" ? [{ format: "online" as const, placeIndex: null }] : []),
      ...(slotFormat !== "online"
        ? inPersonPlaceIndexes.map((placeIndex) => ({ format: "in_person" as const, placeIndex }))
        : []),
    ];
    const submission: TutorApplicationSubmission = {
      firstName: identity.firstName.trim(),
      lastName: identity.lastName.trim(),
      email: identity.email.trim(),
      phone: identity.phone.trim(),
      bio,
      experience: background.experience.trim() || undefined,
      educationBackground:
        [background.degree?.label, background.field, background.institution].filter(Boolean).join(" — ") ||
        undefined,
      highestDegree: background.degree?.id,
      gender: identity.gender ?? undefined,
      birthDate: toIsoDate(identity.birthDate),
      experiences: background.experiences.map((entry) => ({
        type: EXPERIENCE_TYPES.find((t) => t.id === entry.type)?.backend ?? "PROFESSIONAL",
        title: entry.title,
        organization: entry.organization,
        period: entry.period,
        audience: entry.audience.map((id) => EXPERIENCE_AUDIENCES.find((a) => a.id === id)!.backend),
        subjectsTaught: entry.subjects,
        description: entry.description,
      })),
      subjects: subjectLevels.map((sl) => ({
        skillId: sl.skill.id,
        levelIds: sl.levels.map((l) => l.id),
        competenceDescription: sl.skill.scope?.trim() || undefined,
      })),
      offers: offers.flatMap((offer) => {
        if (!offer.skill || !offer.level || !offer.duration) return [];
        return [{
          subjectId: offer.skill.id,
          educationLevelId: offer.level.id,
          trackId: offer.track?.id,
          title: offer.title.trim() || offerTitle(offer.skill, offer.level, offer.track),
          description: offer.description.trim() || offerDescription(offer.skill, offer.level, offer.track),
          format,
          durationMinutes: Math.round(offer.duration.hours * 60),
          price: offer.priceCalculated || Math.round(offer.hourlyRate * offer.duration.hours),
          currency: "MGA",
        }];
      }),
      locations: locations.map(({ label, kind, radiusKm, isPrimary, latitude, longitude }) => ({ label, kind, radiusKm, isPrimary, latitude, longitude })),
      weeklyAvailability: weeklyAvailability.flatMap((day) =>
        day.active
          ? [{
              dayOfWeek: dayIndexes[day.dayId],
              slots: day.slots.flatMap(({ startTime, endTime, format }) =>
                placeVariants(format).map((variant) => ({ startTime, endTime, ...variant })),
              ),
            }]
          : [],
      ),
      dateAvailability: dateAvailability.flatMap(({ date, startTime, endTime, format }) =>
        placeVariants(format).map((variant) => ({ date, startTime, endTime, ...variant })),
      ),
      documents: documents
        .filter((d) => d.provided && d.file)
        .map((d) => ({ kind: d.kind, file: d.file! })),
      introVideo: introVideo
        ? {
            file: {
              uri: introVideo.uri,
              mimeType: introVideo.mimeType,
              sizeBytes: introVideo.fileSize ?? 0,
              fileName: introVideo.fileName,
            },
            durationMs: introVideo.duration,
          }
        : undefined,
    };
    const application = await submit(submission);
    if (application) {
      setApplication(application);
      setIsPendingValidation(true);
      setActiveMode("tutor");
      router.replace(TUTOR_PENDING_ROUTE);
    }
  };

  const handleEditSection = (targetRoute: Href) => {
    setIsEditDrawerOpen(false);
    router.push(targetRoute);
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Récapitulatif de votre dossier</Text>
          <Text className="mb-4 text-[13.5px] text-ink-soft">
            Vérifiez attentivement les informations avant de transmettre votre candidature
          </Text>
        </FadeIn>

        <FadeIn delay={90}>
          {state.status === "error" && state.code !== "unauthorized" ? <FormError message={state.message} /> : null}

          <View className="rounded-xl border border-line bg-surface p-4">
            <View className="mb-2 flex-row items-center justify-between border-b border-line-soft pb-2.5">
              <Text className="text-[14px] font-bold text-ink">Éléments du dossier</Text>
              <PressableScale onPress={() => setIsEditDrawerOpen(true)} accessibilityLabel="Modifier le dossier">
                <View className="flex-row items-center gap-1">
                  <EditIcon size={14} color="#332E86" />
                  <Text className="text-[13px] font-bold text-primary">Modifier</Text>
                </View>
              </PressableScale>
            </View>

            {sections.map((sec) => (
              <PressableScale
                key={sec.id}
                onPress={() => handleEditSection(sec.route)}
                accessibilityLabel={`Modifier ${sec.label}`}
              >
                <View className="flex-row items-center gap-3 border-b border-line-soft/60 py-3">
                  <View
                    className={[
                      "h-[22px] w-[22px] items-center justify-center rounded-full",
                      sec.done ? "bg-accent-tint" : "border border-line bg-paper",
                    ].join(" ")}
                  >
                    {sec.done ? <CheckIcon size={14} color="#0E9C82" /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14.5px] font-bold text-ink">{sec.label}</Text>
                    <Text className="text-[12px] text-ink-soft" numberOfLines={1}>
                      {sec.summary}
                    </Text>
                  </View>
                  <ChevronRightIcon size={16} color="#9799AF" />
                </View>
              </PressableScale>
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <PressableScale onPress={() => setIsEditDrawerOpen(true)} accessibilityLabel="Modifier des sections spécifiques">
            <View className="mt-4 flex-row items-center justify-center gap-2 py-2">
              <EditIcon size={15} color="#332E86" />
              <Text className="text-[14px] font-bold text-primary">
                Ouvrir la modale d&apos;édition ciblée
              </Text>
            </View>
          </PressableScale>
        </FadeIn>
      </ScrollView>

      {/* Drawer / Modale d'édition ciblée sans réinitialiser au début */}
      <Modal visible={isEditDrawerOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="max-h-[85%] rounded-t-2xl bg-surface p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="mb-4 flex-row items-center justify-between border-b border-line-soft pb-3">
              <View>
                <Text className="text-[18px] font-bold text-ink">Modifier une étape ciblée</Text>
                <Text className="text-[12px] text-ink-soft">
                  Accédez directement au formulaire souhaité sans recommencer
                </Text>
              </View>
              <PressableScale onPress={() => setIsEditDrawerOpen(false)} accessibilityLabel="Fermer">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-paper">
                  <XIcon size={16} color="#585B78" />
                </View>
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="gap-2">
              {sections.map((sec) => (
                <PressableScale
                  key={sec.id}
                  onPress={() => handleEditSection(sec.route)}
                  accessibilityLabel={`Éditer ${sec.label}`}
                >
                  <View className="mb-2 flex-row items-center justify-between rounded-xl border border-line bg-paper p-3.5">
                    <View className="flex-1 pr-2">
                      <Text className="text-[14px] font-bold text-ink">{sec.label}</Text>
                      <Text className="mt-0.5 text-[12px] text-ink-soft">{sec.summary}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 rounded-md bg-surface px-2.5 py-1.5 border border-line">
                      <Text className="text-[11.5px] font-bold text-primary">Éditer</Text>
                      <ChevronRightIcon size={12} color="#332E86" />
                    </View>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        {missing.length > 0 ? (
          <Text className="mb-3 text-center text-[12.5px] text-error">Il manque : {missing.join(", ")}.</Text>
        ) : null}
        <Button
          label="Soumettre mon dossier"
          loading={isSubmitting}
          loadingLabel="Transmission en cours..."
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

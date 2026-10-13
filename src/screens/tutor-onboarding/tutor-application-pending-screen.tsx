import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { ScaleIn } from "@/components/motion/scale-in";
import { Button } from "@/components/ui/button";
import { useRealtimeEvent } from "@/realtime/use-realtime-event";
import { AuthService } from "@/services/auth.service";
import { TutorApplicationService } from "@/services/tutor-application.service";
import { useAuthStore } from "@/store/auth.store";
import { useTutorApplicationStore } from "@/store/tutor-application.store";
import type { TutorApplication } from "@/types/tutor-application";

const HOME_ROUTE = "/home" as Href;
const TUTOR_DASHBOARD_ROUTE = "/tutor-dashboard" as Href;
const TUTOR_INTRO_ROUTE = "/tutor-intro" as Href;
const TUTOR_IDENTITY_ROUTE = "/tutor-identity" as Href;

/**
 * Suivi du dossier tuteur : PENDING (en cours d'examen) → APPROVED (visible dans la recherche, accès à
 * l'espace tuteur) ou REJECTED (motif + correction du dossier). Le statut vient du serveur et se met à jour
 * en direct quand l'administrateur tranche.
 */
export function TutorApplicationPendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setActiveMode = useAuthStore((s) => s.setActiveMode);
  const resetWizard = useTutorApplicationStore((s) => s.reset);
  const [application, setApplication] = useState<TutorApplication | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [mine] = await Promise.all([TutorApplicationService.getMyApplication(), AuthService.getMe()]);
      setApplication(mine);
    } catch {
      // hors ligne : on garde le dernier statut connu
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeEvent(["tutor."], () => void refresh());

  const status = user?.tutor?.applicationStatus ?? application?.status ?? null;

  // Garde : sans dossier envoyé il n'y a rien à suivre — retour à la présentation « Devenir tuteur ».
  useEffect(() => {
    if (loaded && (status === null || status === "draft")) router.replace(TUTOR_INTRO_ROUTE);
  }, [loaded, status, router]);

  if (!loaded && !status) return null;

  const goHome = () => router.replace(HOME_ROUTE);
  const goToDashboard = () => {
    setActiveMode("tutor");
    router.replace(TUTOR_DASHBOARD_ROUTE);
  };
  const correctApplication = () => {
    resetWizard();
    router.replace(TUTOR_IDENTITY_ROUTE);
  };

  const approved = status === "approved";
  const rejected = status === "rejected";

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pb-[14px] pt-5">
        <Text className="text-[21px] font-bold text-ink">
          edU<Text className="text-primary">loc</Text>
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <ScaleIn delay={20}>
          <View
            className={[
              "mb-[22px] mt-3 h-[72px] w-[72px] items-center justify-center rounded-full",
              approved ? "bg-accent-tint" : rejected ? "bg-error-tint" : "bg-warning-tint",
            ].join(" ")}
          >
            {approved ? (
              <CheckCircleIcon size={32} color="#0E9C82" />
            ) : rejected ? (
              <XCircleIcon size={32} color="#E04F5F" />
            ) : (
              <ClockIcon size={32} color="#BD7E28" />
            )}
          </View>
        </ScaleIn>

        <FadeIn delay={90}>
          <Text className="mb-[10px] text-center text-[22px] font-bold text-ink">
            {approved ? "Dossier approuvé" : rejected ? "Dossier refusé" : "Dossier envoyé"}
          </Text>
        </FadeIn>

        <FadeIn delay={130}>
          <Text className="mb-[22px] text-center text-[14.5px] leading-[21px] text-ink-soft">
            {approved
              ? "Félicitations ! Votre profil est visible dans la recherche et vous pouvez recevoir des demandes de cours."
              : rejected
                ? "Votre candidature n'a pas été retenue en l'état. Vous pouvez corriger votre dossier et le soumettre à nouveau."
                : "Votre candidature est en cours de vérification par EduLoc."}
          </Text>
        </FadeIn>

        {rejected && application?.rejectionReason ? (
          <FadeIn delay={150}>
            <View className="mb-6 w-full rounded-lg border border-line bg-surface p-4">
              <Text className="mb-1 text-[12px] font-bold uppercase tracking-[0.03em] text-ink-soft">Motif</Text>
              <Text className="text-[14px] text-ink">{application.rejectionReason}</Text>
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={160}>
          <View
            className={[
              "mb-6 flex-row items-center gap-[6px] self-center rounded-full px-[11px] py-[5px]",
              approved ? "bg-accent-tint" : rejected ? "bg-error-tint" : "bg-warning-tint",
            ].join(" ")}
          >
            <View className={["h-[7px] w-[7px] rounded-full", approved ? "bg-accent" : rejected ? "bg-error" : "bg-warning"].join(" ")} />
            <Text className={["text-[12px] font-semibold", approved ? "text-accent" : rejected ? "text-error" : "text-warning"].join(" ")}>
              {approved ? "APPROUVÉ" : rejected ? "REFUSÉ" : "EN ATTENTE"}
            </Text>
          </View>
        </FadeIn>

        {!approved && !rejected ? (
          <FadeIn delay={200}>
            <Text className="text-center text-[12.5px] leading-[19px] text-ink-faint">
              Vous recevrez une notification lorsque votre dossier sera traité. Tant qu&apos;il n&apos;est pas approuvé,
              vous n&apos;apparaissez pas dans les résultats de recherche.
            </Text>
          </FadeIn>
        ) : null}
      </ScrollView>

      <View className="gap-2 border-t border-line-soft bg-surface px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 22) }}>
        {approved ? <Button label="Accéder à mon espace tuteur" variant="primary"  onPress={goToDashboard} /> : null}
        {rejected ? <Button label="Corriger mon dossier" variant="primary"  onPress={correctApplication} /> : null}
        <Button label="Retour à l'accueil" variant="ghost" onPress={goHome} />
      </View>
    </View>
  );
}

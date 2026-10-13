import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LockIcon } from "@/components/icons";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { useMyBooking } from "@/hooks/use-my-booking";
import { useSessionCode } from "@/hooks/use-session-code";

function bookingRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}` as Href;
}
function sessionRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/session` as Href;
}

export function SessionOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state: bookingState } = useMyBooking(id);
  const { state: codeState } = useSessionCode(bookingState.status === "success" ? bookingState.booking.id : undefined);

  // Une séance déjà en cours n'a plus besoin de cet écran. Le tuteur démarre la séance depuis SON appli avec ce code :
  // useMyBooking suit l'événement temps réel « session.started » et on bascule ici sans action de l'utilisateur.
  useEffect(() => {
    if (bookingState.status === "success" && bookingState.booking.status === "in_progress") {
      router.replace(sessionRoute(bookingState.booking.id));
    }
  }, [bookingState, router]);

  if (bookingState.status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-paper" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#332E86" />
      </View>
    );
  }

  if (bookingState.status === "error" || bookingState.booking.status !== "confirmed") {
    const message =
      bookingState.status === "error"
        ? bookingState.message
        : "Le code de séance n'est disponible que pour un rendez-vous confirmé.";
    return (
      <View className="flex-1 items-center justify-center gap-5 bg-paper px-8" style={{ paddingTop: insets.top }}>
        <Text className="text-center text-[14px] text-ink-soft">{message}</Text>
        {id ? <Button label="Retour au rendez-vous" onPress={() => router.replace(bookingRoute(id))} /> : null}
      </View>
    );
  }

  const { booking } = bookingState;

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />

      <View className="flex-1 items-center px-6 pt-5">
        <View className="mb-[18px] h-16 w-16 items-center justify-center rounded-full bg-primary-tint">
          <LockIcon size={28} color="#332E86" />
        </View>
        <Text className="mb-2 text-[22px] font-bold text-ink">Code de séance</Text>
        <Text className="mb-[22px] text-center text-[14px] leading-[21px] text-ink-soft">
          Communiquez ce code à {booking.offer.tutorName.split(" ")[0]} au moment de démarrer la séance de {booking.offer.subjectLabel}.
        </Text>

        <View className="w-full items-center rounded-lg border border-primary-tint bg-primary-tint p-[22px]">
          {codeState.status === "loading" ? (
            <View className="h-9 w-[160px] rounded bg-white/60" />
          ) : codeState.status === "error" ? (
            <FormError message={codeState.message} />
          ) : (
            <Text className="text-[34px] font-bold tracking-[0.12em] text-primary-dark">{codeState.code}</Text>
          )}
        </View>

        <Text className="mt-[18px] text-center text-[12.5px] text-ink-faint">
          Cet écran se met à jour tout seul dès que le tuteur démarre la séance.
        </Text>
      </View>

      <View className="border-t border-line-soft bg-surface px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 22) }}>
        <Button label="Retour au rendez-vous" onPress={() => router.replace(bookingRoute(booking.id))} />
      </View>
    </View>
  );
}

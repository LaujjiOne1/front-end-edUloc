import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarIcon, ClockIcon, LocationIcon, MicIcon, PhoneIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { CancelBookingModal } from "@/components/ui/cancel-booking-modal";
import { FormError } from "@/components/ui/form-error";
import { StatusBadge } from "@/components/ui/status-badge";
import { useBookingCancelAction } from "@/hooks/use-booking-cancel-action";
import { useMyBooking } from "@/hooks/use-my-booking";
import { useSessionCode } from "@/hooks/use-session-code";
import type { Booking } from "@/types/booking";

const BOOKINGS_ROUTE = "/apprenti-dashboard/bookings" as Href;
function conversationRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/conversation` as Href;
}
function callRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/call` as Href;
}
function otpRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/otp` as Href;
}
function sessionRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/session` as Href;
}
function reviewRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/review` as Href;
}

export function BookingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, retry } = useMyBooking(id);
  const { state: cancelState, cancel, reset: resetCancel } = useBookingCancelAction();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [hoursToStart, setHoursToStart] = useState(Number.POSITIVE_INFINITY);

  const isCancelling = cancelState.status === "cancelling";

  const openCancel = (startAt: string) => {
    resetCancel();
    setHoursToStart((new Date(startAt).getTime() - Date.now()) / 3_600_000);
    setCancelOpen(true);
  };

  // Le motif part au serveur (obligatoire à moins de 24 h de la séance, annulation refusée à moins de 2 h).
  const handleCancel = async (bookingId: string, reason?: string) => {
    const result = await cancel(bookingId, reason);
    if (result) {
      setCancelOpen(false);
      router.replace(BOOKINGS_ROUTE);
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />

      {state.status === "loading" ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#332E86" />
        </View>
      ) : state.status === "error" ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-[14px] text-error">{state.message}</Text>
          <PressableScale onPress={retry} accessibilityLabel="Réessayer">
            <Text className="text-[14px] font-semibold text-primary">Réessayer</Text>
          </PressableScale>
        </View>
      ) : (
        <BookingDetailContent
          booking={state.booking}
          formError={null}
          onOpenConversation={() => router.push(conversationRoute(state.booking.id))}
          onOpenCall={() => router.push(callRoute(state.booking.id))}
          onOpenOtp={() => router.push(otpRoute(state.booking.id))}
          onJoinSession={() => router.push(sessionRoute(state.booking.id))}
          onReview={() => router.push(reviewRoute(state.booking.id))}
        />
      )}

      {state.status === "success" && (state.booking.status === "pending" || state.booking.status === "confirmed") ? (
        <View className="border-t border-line-soft bg-surface px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 22) }}>
          <Button
            label={state.booking.status === "pending" ? "Annuler la demande" : "Annuler"}
            variant="ghost"
            fullWidth
            disabled={isCancelling}
            onPress={() => openCancel(state.booking.slot.startAt)}
          />
        </View>
      ) : null}

      {state.status === "success" ? (
        <CancelBookingModal
          visible={cancelOpen}
          hoursToStart={hoursToStart}
          pending={isCancelling}
          title={state.booking.status === "pending" ? "Annuler la demande" : "Annuler le rendez-vous"}
          errorMessage={cancelState.status === "error" ? cancelState.message : null}
          onClose={() => setCancelOpen(false)}
          onConfirm={(reason) => handleCancel(state.booking.id, reason)}
        />
      ) : null}
    </View>
  );
}

function BookingDetailContent({
  booking,
  formError,
  onOpenConversation,
  onOpenCall,
  onOpenOtp,
  onJoinSession,
  onReview,
}: {
  booking: Booking;
  formError: string | null;
  onOpenConversation: () => void;
  onOpenCall: () => void;
  onOpenOtp: () => void;
  onJoinSession: () => void;
  onReview: () => void;
}) {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      <View className="mb-[6px] flex-row items-start justify-between">
        <Text className="text-[24px] font-bold text-ink">{booking.offer.subjectLabel}</Text>
        <StatusBadge status={booking.status} />
      </View>
      <Text className="mb-5 text-[14px] text-ink-soft">avec {booking.offer.tutorName}</Text>

      {formError ? <FormError message={formError} /> : null}

      <View className="mb-4 rounded-lg border border-line bg-surface p-4">
        <View className="mb-2 flex-row items-center gap-2">
          <CalendarIcon size={15} color="#585B78" />
          <Text className="text-[14px] font-semibold text-ink">{booking.slot.dateLabel}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <ClockIcon size={15} color="#585B78" />
          <Text className="text-[14px] font-semibold text-ink">
            {booking.slot.startTime} → {booking.slot.endTime}
          </Text>
        </View>
        {booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "completed" ? (
          <View className="mt-2 flex-row items-center gap-2">
            <LocationIcon size={15} color="#585B78" />
            <Text className="text-[14px] font-semibold text-ink">{booking.offer.location}</Text>
          </View>
        ) : null}
      </View>

      {booking.status === "pending" ? <PendingSection tutorName={booking.offer.tutorName} onOpenConversation={onOpenConversation} /> : null}
      {booking.status === "confirmed" ? (
        <ConfirmedSection bookingId={booking.id} onOpenConversation={onOpenConversation} onOpenCall={onOpenCall} onOpenOtp={onOpenOtp} />
      ) : null}
      {booking.status === "in_progress" ? <InProgressSection onJoinSession={onJoinSession} /> : null}
      {booking.status === "completed" ? (
        <CompletedSection durationLabel={booking.sessionDurationLabel} onOpenConversation={onOpenConversation} onReview={onReview} />
      ) : null}
      {booking.status === "cancelled" || booking.status === "refused" ? <ClosedSection status={booking.status} /> : null}
    </ScrollView>
  );
}

function PendingSection({ tutorName, onOpenConversation }: { tutorName: string; onOpenConversation: () => void }) {
  return (
    <>
      <FadeIn delay={30}>
        <View className="mb-5 rounded-lg border border-warning-tint bg-warning-tint p-4">
          <Text className="text-[13.5px] font-semibold leading-[19px] text-warning">
            Demande en attente. {tutorName.split(" ")[0]} doit l&apos;accepter pour confirmer le rendez-vous.
          </Text>
        </View>
      </FadeIn>

      <FadeIn delay={70}>
        <Text className="mb-[10px] text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">Communication</Text>
        <Text className="mb-[14px] text-[13.5px] leading-[19px] text-ink-soft">
          Vous pouvez communiquer avec le tuteur par message vocal. L&apos;appel sera disponible après confirmation.
        </Text>
        <Button label="Envoyer un vocal" variant="secondary" fullWidth icon={<MicIcon size={17} color="#332E86" />} onPress={onOpenConversation} />
      </FadeIn>
    </>
  );
}

function ConfirmedSection({
  bookingId,
  onOpenConversation,
  onOpenCall,
  onOpenOtp,
}: {
  bookingId: string;
  onOpenConversation: () => void;
  onOpenCall: () => void;
  onOpenOtp: () => void;
}) {
  const { state } = useSessionCode(bookingId);

  return (
    <>
      <FadeIn delay={30}>
        <PressableScale onPress={onOpenOtp} accessibilityLabel="Voir le code de séance">
          <View className="mb-4 items-center rounded-lg border border-primary-tint bg-primary-tint p-[22px]">
            <Text className="mb-2 text-[12px] font-bold uppercase tracking-[0.04em] text-primary">Code de séance</Text>
            {state.status === "loading" ? (
              <View className="h-9 w-[140px] rounded bg-white/60" />
            ) : state.status === "error" ? (
              <Text className="text-[13px] text-error">{state.message}</Text>
            ) : (
              <Text className="text-[30px] font-bold tracking-[0.1em] text-primary-dark">{state.code}</Text>
            )}
            <Text className="mt-2 text-[12px] text-ink-soft">À communiquer au tuteur au début de la séance</Text>
          </View>
        </PressableScale>
      </FadeIn>

      <FadeIn delay={70}>
        <View className="flex-row gap-[10px]">
          <Button label="Conversation" variant="secondary" icon={<MicIcon size={16} color="#332E86" />} onPress={onOpenConversation} className="flex-1" />
          <Button label="Appeler" icon={<PhoneIcon size={16} color="#fff" />} onPress={onOpenCall} className="flex-1" />
        </View>
      </FadeIn>
    </>
  );
}

function InProgressSection({ onJoinSession }: { onJoinSession: () => void }) {
  return (
    <FadeIn delay={30}>
      <View className="mb-5 items-center rounded-lg border border-primary-tint bg-primary-tint p-5">
        <Text className="mb-3 text-center text-[14px] font-semibold text-primary">La séance est en cours.</Text>
        <Button label="Rejoindre la séance" onPress={onJoinSession} />
      </View>
    </FadeIn>
  );
}

function CompletedSection({
  durationLabel,
  onOpenConversation,
  onReview,
}: {
  durationLabel?: string;
  onOpenConversation: () => void;
  onReview: () => void;
}) {
  return (
    <FadeIn delay={30}>
      <View className="mb-5 rounded-lg border border-line bg-surface p-4">
        <Text className="text-[13.5px] text-ink-soft">Séance terminée{durationLabel ? ` • Durée : ${durationLabel}` : ""}.</Text>
      </View>
      <View className="flex-row gap-[10px]">
        <Button label="Conversation" variant="secondary" onPress={onOpenConversation} className="flex-1" />
        <Button label="Évaluer le tuteur" onPress={onReview} className="flex-1" />
      </View>
    </FadeIn>
  );
}

function ClosedSection({ status }: { status: "cancelled" | "refused" }) {
  return (
    <FadeIn delay={30}>
      <View className="items-center rounded-lg border border-line bg-surface py-8">
        <Text className="text-center text-[13.5px] text-ink-soft">
          {status === "cancelled" ? "Ce rendez-vous a été annulé." : "Cette demande a été refusée par le tuteur."}
        </Text>
      </View>
    </FadeIn>
  );
}

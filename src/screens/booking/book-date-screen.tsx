import { type Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckIcon, ClockIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { type DayMarkers, HabitCalendar } from "@/components/ui/habit-calendar";
import { useOfferSlots } from "@/hooks/use-offer-slots";
import { TEACHING_MODE_LABELS } from "@/lib/teaching-mode";
import { toIsoDate } from "@/lib/week";
import { useAuthStore } from "@/store/auth.store";
import { useBookingWizardStore } from "@/store/booking-wizard.store";
import type { OfferSlot } from "@/types/offer";
import { formatDayLabel } from "@/utils/calendar";

// Existing routes — Login already exists (src/app/login.tsx); Beneficiary is
// built by this same task (src/app/beneficiary.tsx).
const LOGIN_ROUTE = "/login" as Href;
const BENEFICIARY_ROUTE = "/beneficiary" as Href;

/**
 * Choix du rendez-vous : le calendrier (semaine glissante, extensible en mois) montre les jours avec des
 * créneaux ; on choisit une date, on voit ses créneaux, puis on en choisit un. C'est le SEUL écran de choix de
 * créneau du parcours de réservation (la fiche de l'offre n'en propose plus).
 */
export function BookDateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const offer = useBookingWizardStore((s) => s.offer);
  const preselectedSlot = useBookingWizardStore((s) => s.slot);
  const setBooking = useBookingWizardStore((s) => s.setBooking);

  const { slots, loading, error, ensureRange, retry } = useOfferSlots(offer);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(preselectedSlot?.id ?? null);
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

  // Jours avec au moins un créneau libre → pastille sur le calendrier.
  const availableSlots = useMemo(() => slots.filter((s) => s.status === "available"), [slots]);
  const markers = useMemo(() => {
    const out: Record<string, DayMarkers> = {};
    for (const slot of availableSlots) out[slot.date] = { availability: true };
    return out;
  }, [availableSlots]);
  const firstAvailableDate = availableSlots.length > 0 ? availableSlots.map((s) => s.date).sort()[0] : null;

  // Date affichée : celle que le demandeur a choisie, sinon celle d'un créneau déjà retenu, sinon la première
  // disponible, sinon aujourd'hui.
  const selectedDate = pickedDate ?? preselectedSlot?.date ?? firstAvailableDate ?? todayIso;
  const daySlots = useMemo(() => slots.filter((s) => s.date === selectedDate), [slots, selectedDate]);
  const selectedSlot = daySlots.find((s) => s.id === selectedSlotId) ?? null;
  const nextDate = useMemo(
    () => availableSlots.map((s) => s.date).filter((d) => d > selectedDate).sort()[0] ?? null,
    [availableSlots, selectedDate],
  );

  // Guard: BookDate only makes sense once an offer has been picked
  // (OfferDetail's "Choisir un créneau" sets it before navigating here).
  // Reaching this route without that context — e.g. a stale deep link —
  // bounces to Home instead of rendering a broken screen (AGENTS.md §13).
  useEffect(() => {
    if (!offer) router.replace("/home");
  }, [offer, router]);

  if (!offer) return null;

  const canReserve = !!selectedSlot && selectedSlot.status === "available" && !isNavigating;

  const pickDate = (iso: string) => {
    setPickedDate(iso);
    setSelectedSlotId(null);
  };

  const reserve = () => {
    if (!canReserve || !selectedSlot) return;
    setIsNavigating(true);
    setBooking(offer, selectedSlot);
    const authenticated = useAuthStore.getState().user !== null;
    router.push(authenticated ? BENEFICIARY_ROUTE : LOGIN_ROUTE);
  };

  const dayLabel = daySlots[0]?.dateLabel ?? formatDayLabel(selectedDate);

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Choisissez votre rendez-vous</Text>
          <Text className="mb-[18px] text-[13.5px] text-ink-soft">
            {offer.title} — avec {offer.tutorName}
          </Text>
        </FadeIn>

        <FadeIn delay={80}>
          <HabitCalendar
            variant="card"
            selectedDate={selectedDate}
            onSelectDate={pickDate}
            markers={markers}
            minDate={todayIso}
            onViewChange={ensureRange}
          />
          <View className="mt-2.5 flex-row items-center gap-2 px-1">
            <View className="h-[7px] w-[7px] rounded-full bg-accent" />
            <Text className="text-[12px] text-ink-soft">Jours avec des créneaux disponibles</Text>
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <View className="mt-[20px]">
            <Text className="mb-[6px] ml-0.5 text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">
              Créneaux — {dayLabel.charAt(0).toLowerCase() + dayLabel.slice(1)}
            </Text>
            {error ? (
              <View className="flex-row items-center gap-3">
                <Text className="flex-1 text-[13.5px] text-error">{error}</Text>
                <PressableScale onPress={retry} accessibilityLabel="Réessayer">
                  <Text className="text-[13.5px] font-semibold text-primary">Réessayer</Text>
                </PressableScale>
              </View>
            ) : loading && slots.length === 0 ? (
              <View className="gap-[10px]">
                {[0, 1].map((i) => (
                  <View key={i} className="h-[56px] rounded-lg bg-line-soft" />
                ))}
              </View>
            ) : daySlots.length === 0 ? (
              <View className="rounded-lg border border-line bg-surface p-4">
                <Text className="text-[13.5px] text-ink-soft">
                  {slots.length === 0 && !loading
                    ? "Aucun créneau disponible pour le moment."
                    : "Aucun créneau ce jour-là."}
                </Text>
                {nextDate ? (
                  <PressableScale onPress={() => pickDate(nextDate)} accessibilityLabel="Aller à la prochaine disponibilité">
                    <Text className="mt-2 text-[13.5px] font-bold text-primary">
                      Prochaine disponibilité : {formatDayLabel(nextDate).toLowerCase()} →
                    </Text>
                  </PressableScale>
                ) : null}
              </View>
            ) : (
              <View className="gap-[10px]">
                {daySlots.map((slot) => (
                  <TimeSlotRow
                    key={slot.id}
                    slot={slot}
                    selected={slot.id === selectedSlotId}
                    onPress={() => setSelectedSlotId(slot.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <Text className="mt-4 text-[12px] leading-[18px] text-ink-faint">
            La disponibilité est vérifiée par EduLoc en temps réel. Réservation possible jusqu&apos;à 2h avant le
            créneau.
          </Text>
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button label="Réserver ce créneau" disabled={!canReserve} onPress={reserve} />
      </View>
    </View>
  );
}

type TimeSlotRowProps = {
  slot: OfferSlot;
  selected: boolean;
  onPress: () => void;
};

function TimeSlotRow({ slot, selected, onPress }: TimeSlotRowProps) {
  const booked = slot.status === "unavailable";

  return (
    <PressableScale
      onPress={onPress}
      disabled={booked}
      accessibilityLabel={`${slot.timeRangeLabel}${booked ? ", créneau pris" : ""}`}
    >
      <View
        className={[
          "flex-row items-center justify-between rounded-lg border p-4",
          !booked && selected ? "border-primary bg-primary-tint" : "border-line bg-surface",
        ].join(" ")}
      >
        <View className="flex-row items-center gap-[10px]">
          <ClockIcon size={16} color={!booked && selected ? "#332E86" : "#585B78"} />
          <Text className="text-[14.5px] font-bold text-ink">{slot.timeRangeLabel}</Text>
          {slot.teachingMode ? (
            <Text className="text-[11.5px] font-semibold text-primary">{TEACHING_MODE_LABELS[slot.teachingMode]}</Text>
          ) : null}
        </View>
        {booked ? (
          <Text className="text-[12px] font-semibold text-ink-faint">Pris</Text>
        ) : selected ? (
          <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
            <CheckIcon size={11} color="#fff" />
          </View>
        ) : (
          <View className="h-5 w-5 rounded-full border-2 border-line" />
        )}
      </View>
    </PressableScale>
  );
}

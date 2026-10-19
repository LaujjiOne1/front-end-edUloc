import { type Href, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarIcon, ClockIcon, HouseIcon, LocationIcon, MicIcon, VideoIcon } from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { StepProgress } from "@/components/ui/step-progress";
import { useCreateBooking } from "@/hooks/use-create-booking";
import { useBookingWizardStore } from "@/store/booking-wizard.store";
import type { TeachingModeId } from "@/types/booking";

const BOOKING_PENDING_ROUTE = "/booking-pending" as Href;
const BOOK_DATE_ROUTE = "/results/book" as Href;
const BENEFICIARY_PROFILE_ROUTE = "/beneficiary-profile" as Href;

const OBJECTIVE_LABELS: Record<string, string> = {
  remedial: "Remise à niveau",
  ongoing: "Accompagnement régulier",
  excellence: "Approfondir",
};

/** Derives the booking's teaching mode from the chosen slot's place — every
 * slot shown on BookDate already comes from one specific availability/place,
 * so no separate "teaching mode" picker is needed (AGENTS.md §11). */
function resolveTeachingMode(placeId: string | null, places: { id: string; type: string }[]): TeachingModeId {
  if (!placeId) return "online";
  const place = places.find((p) => p.id === placeId);
  if (place?.type === "online") return "online";
  if (place?.type === "tutor_home") return "at_home_tutor";
  if (place?.type === "beneficiary_home") return "at_home_beneficiary";
  return "public_place";
}

export function BookingSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const offer = useBookingWizardStore((s) => s.offer);
  const slot = useBookingWizardStore((s) => s.slot);
  const beneficiary = useBookingWizardStore((s) => s.beneficiary);
  const beneficiaryAddress = useBookingWizardStore((s) => s.beneficiaryAddress);
  const setBeneficiaryAddress = useBookingWizardStore((s) => s.setBeneficiaryAddress);
  const setCreatedBookingId = useBookingWizardStore((s) => s.setCreatedBookingId);
  const idempotencyKey = useBookingWizardStore((s) => s.idempotencyKey);
  const note = useBookingWizardStore((s) => s.note);
  const objective = useBookingWizardStore((s) => s.objective);
  const { state, submit } = useCreateBooking();

  // Guard: a full recap needs an offer, a slot, and a chosen beneficiary —
  // i.e. BookDate + Beneficiary must both be completed already.
  const hasContext = !!offer && !!slot && !!beneficiary;

  useEffect(() => {
    if (!hasContext) router.replace("/home");
  }, [hasContext, router]);

  if (!hasContext || !offer || !slot || !beneficiary) return null;

  // Le serveur calcule le mode de chaque créneau d'après son lieu : on réserve exactement ce qui a été affiché.
  const teachingMode = slot.teachingMode ?? resolveTeachingMode(slot.placeId, offer.places);
  const needsAddress = teachingMode === "at_home_beneficiary";

  const isSubmitting = state.status === "loading";
  // Lieu et format viennent du CRÉNEAU choisi (pas de l'offre, qui peut proposer les deux formats).
  const slotPlace = offer.places.find((p) => p.id === slot.placeId);
  const FormatIcon = teachingMode === "online" ? VideoIcon : HouseIcon;
  const formatLabel = teachingMode === "online" ? "En ligne" : "Présentiel";
  const placeLabel =
    teachingMode === "online"
      ? "En ligne (visioconférence)"
      : teachingMode === "at_home_beneficiary"
        ? `À votre domicile${slotPlace ? ` · ${slotPlace.label}` : ""}`
        : (slotPlace?.label ?? offer.location);

  const canSubmit = !needsAddress || beneficiaryAddress.trim().length > 0;

  const sendRequest = async () => {
    if (isSubmitting || !canSubmit) return;
    const booking = await submit({
      idempotencyKey: idempotencyKey || undefined,
      offerId: offer.id,
      slot: { availabilityId: slot.availabilityId, startAt: slot.startAt, placeId: slot.placeId },
      beneficiaryId: beneficiary.id,
      teachingMode,
      beneficiaryAddress: needsAddress ? beneficiaryAddress.trim() : undefined,
      note: note.trim() || undefined,
    });
    if (booking) {
      setCreatedBookingId(booking.id);
      router.push(BOOKING_PENDING_ROUTE);
    }
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={3} total={3} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-[18px] text-[24px] font-bold text-ink">Votre demande</Text>
        </FadeIn>

        <FadeIn delay={80}>
          <View className="rounded-lg border border-line bg-surface p-4">
            <SummaryRow label="Tuteur" value={offer.tutorName} />
            <Divider />
            <SummaryRow label="Cours" value={offer.title} />
            <Divider />
            <SummaryRow label="Bénéficiaire" value={beneficiary.isSelf ? "Vous" : beneficiary.firstName} />
            <Divider />
            <SummaryRow label="Objectif" value={OBJECTIVE_LABELS[objective] ?? "—"} />
            <Divider />
            <SummaryRow label="Date" value={slot.dateLabel} icon={<CalendarIcon size={15} color="#9799AF" />} />
            <Divider />
            <SummaryRow label="Horaire" value={slot.timeRangeLabel} icon={<ClockIcon size={15} color="#9799AF" />} />
            <Divider />
            <SummaryRow label="Lieu" value={placeLabel} icon={<LocationIcon size={15} color="#9799AF" />} />
            <Divider />
            <SummaryRow
              label="Format"
              value={formatLabel}
              icon={<FormatIcon size={15} color="#9799AF" />}
            />
          </View>
        </FadeIn>

        {needsAddress ? (
          <FadeIn delay={100}>
            <View className="mt-[14px]">
              <Text className="mb-[6px] ml-0.5 text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">
                Adresse du bénéficiaire
              </Text>
              <TextInput
                value={beneficiaryAddress}
                onChangeText={setBeneficiaryAddress}
                placeholder="Le tuteur se déplace chez vous — précisez l'adresse"
                placeholderTextColor="#9799AF"
                className="rounded-sm border border-line bg-surface px-[14px] py-[13px] text-[15px] text-ink"
                accessibilityLabel="Adresse du bénéficiaire"
              />
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={120}>
          <PressableScale onPress={() => router.push(BENEFICIARY_PROFILE_ROUTE)} accessibilityLabel="Modifier votre besoin">
            <View className="mt-[14px] flex-row items-center gap-3 rounded-lg border border-line bg-surface p-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-tint">
                <MicIcon size={16} color="#0E9C82" />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] text-ink-soft">Besoin</Text>
                <Text className="text-[14px] font-bold text-ink" numberOfLines={2}>
                  {note.trim() ? note.trim() : "Aucune précision ajoutée"}
                </Text>
              </View>
              <Text className="text-[12.5px] font-bold text-primary">Modifier</Text>
            </View>
          </PressableScale>
        </FadeIn>

        <FadeIn delay={150}>
          <PressableScale onPress={() => router.push(BOOK_DATE_ROUTE)} accessibilityLabel="Modifier la date et l'heure">
            <Text className="mt-4 text-center text-[14px] font-bold text-primary">Modifier</Text>
          </PressableScale>
        </FadeIn>

        {state.status === "error" ? (
          <View className="mt-4">
            <FormError message={state.message} />
          </View>
        ) : null}
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label="Envoyer la demande"
          loading={isSubmitting}
          loadingLabel="Envoi..."
          disabled={isSubmitting || !canSubmit}
          onPress={sendRequest}
        />
      </View>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-line-soft" />;
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-[11px]">
      <Text className="text-[13.5px] text-ink-soft">{label}</Text>
      <View className="flex-row items-center gap-[6px]">
        <Text className="text-[14px] font-bold text-ink">{value}</Text>
        {icon}
      </View>
    </View>
  );
}

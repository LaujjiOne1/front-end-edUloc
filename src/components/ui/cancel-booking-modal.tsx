import { useEffect, useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XIcon } from "@/components/icons";
import { PressableScale } from "@/components/motion/pressable-scale";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

/** Règles d'annulation du serveur (BookingPolicy) : refus à moins de 2 h, motif obligatoire à moins de 24 h. */
const MIN_NOTICE_HOURS = 2;
const FREE_NOTICE_HOURS = 24;

type CancelBookingModalProps = {
  visible: boolean;
  /** Heures restantes avant le début (calculées à l'ouverture) : détermine ce que la politique d'annulation exige. */
  hoursToStart: number;
  pending: boolean;
  /** Intitulé : « Annuler la demande » (PENDING) ou « Annuler le rendez-vous ». */
  title: string;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
};

/**
 * Confirmation d'annulation avec motif. Applique côté écran la politique du serveur pour éviter un aller-retour
 * inutile ; le serveur reste l'autorité (il refuse de toute façon une annulation hors règles).
 */
export function CancelBookingModal({ visible, hoursToStart, pending, title, errorMessage, onClose, onConfirm }: CancelBookingModalProps) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  const tooLate = hoursToStart < MIN_NOTICE_HOURS;
  const needsReason = !tooLate && hoursToStart < FREE_NOTICE_HOURS;
  const canConfirm = !pending && !tooLate && (!needsReason || reason.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-2xl bg-surface p-5" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-ink">{title}</Text>
            <PressableScale onPress={onClose} disabled={pending} accessibilityLabel="Fermer">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-paper">
                <XIcon size={16} color="#585B78" />
              </View>
            </PressableScale>
          </View>

          {tooLate ? (
            <Text className="mb-4 text-[13.5px] leading-[20px] text-error">
              Annulation impossible à moins de {MIN_NOTICE_HOURS} h du début. Contactez le tuteur par message vocal.
            </Text>
          ) : (
            <Text className="mb-3 text-[13.5px] leading-[20px] text-ink-soft">
              {needsReason
                ? `Le rendez-vous a lieu dans moins de ${FREE_NOTICE_HOURS} h : indiquez le motif de l'annulation.`
                : "Cette action est définitive. Vous pouvez préciser un motif (facultatif)."}
            </Text>
          )}

          {errorMessage ? <FormError message={errorMessage} /> : null}

          {tooLate ? null : (
            <TextInput
              value={reason}
              onChangeText={setReason}
              editable={!pending}
              multiline
              maxLength={1000}
              placeholder={needsReason ? "Motif de l'annulation (obligatoire)" : "Motif (facultatif)"}
              placeholderTextColor="#9799AF"
              className="mb-4 min-h-[84px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[14.5px] text-ink"
              style={{ textAlignVertical: "top" }}
              accessibilityLabel="Motif de l'annulation"
            />
          )}

          <View className="flex-row gap-[10px]">
            <Button label="Retour" variant="ghost" fullWidth disabled={pending} onPress={onClose} />
            {tooLate ? null : (
              <Button
                label="Confirmer l'annulation"
                fullWidth
                loading={pending}
                loadingLabel="Annulation..."
                disabled={!canConfirm}
                onPress={() => onConfirm(reason.trim() || undefined)}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

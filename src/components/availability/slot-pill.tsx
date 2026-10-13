import { Text, View } from "react-native";

import { ClockIcon, LocationIcon, PlusIcon, TrashIcon, VideoIcon } from "@/components/icons";
import { PressableScale } from "@/components/motion/pressable-scale";
import type { LocationFormatId } from "@/types/common";

export const FORMAT_LABEL: Record<LocationFormatId, string> = { online: "Visio", in_person: "Présentiel", both: "Les deux" };

/** Une plage horaire (« 17:00 - 20:00 », format optionnel) avec sa corbeille. */
export function SlotPill({
  startTime,
  endTime,
  format,
  onRemove,
}: {
  startTime: string;
  endTime: string;
  /** Absent : le format découle du lieu choisi (tableau de bord), on ne l'affiche pas. */
  format?: LocationFormatId;
  onRemove?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
      <ClockIcon size={13} color="#332E86" />
      <Text className="text-[13px] font-bold text-ink">
        {startTime} - {endTime}
      </Text>
      {format ? (
        <View className="flex-row items-center gap-1 rounded bg-surface px-1.5 py-0.5">
          {format === "online" ? <VideoIcon size={11} color="#585B78" /> : <LocationIcon size={11} color="#585B78" />}
          <Text className="text-[10.5px] font-semibold text-ink-soft">{FORMAT_LABEL[format]}</Text>
        </View>
      ) : null}
      {onRemove ? (
        <PressableScale onPress={onRemove} accessibilityLabel="Supprimer ce créneau">
          <View className="ml-1">
            <TrashIcon size={12} color="#E04F5F" />
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label}>
      <View className="flex-row items-center gap-1 rounded-full border border-primary bg-primary-tint/30 px-3 py-1.5">
        <PlusIcon size={13} color="#332E86" />
        <Text className="text-[12px] font-bold text-primary">Ajouter</Text>
      </View>
    </PressableScale>
  );
}

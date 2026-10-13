import { type Href, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlertTriangleIcon } from "@/components/icons";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";

const REQUESTS_ROUTE = "/tutor-dashboard/requests" as Href;

export function RequestConflictScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-[22px] mt-3 h-[72px] w-[72px] items-center justify-center rounded-full bg-error-tint">
          <AlertTriangleIcon size={32} color="#AC4A40" />
        </View>
        <Text className="mb-[10px] text-center text-[21px] font-bold text-ink">Impossible d&apos;accepter</Text>
        <Text className="mb-2 text-center text-[14.5px] leading-[22px] text-ink-soft">
          Ce créneau n&apos;est plus disponible.
        </Text>
        <Text className="mb-6 text-center text-[13px] leading-[20px] text-ink-faint">
          Une autre demande a été confirmée entre-temps pour ce créneau.
        </Text>
        <View className="w-full rounded-lg bg-paper-alt p-4">
          <Text className="text-[11px] font-bold tracking-[0.03em] text-ink-faint">CODE ERREUR</Text>
          <Text className="mt-1 text-[14px] font-bold text-ink">409 · SLOT_NO_LONGER_AVAILABLE</Text>
        </View>
      </ScrollView>

      <View className="border-t border-line-soft bg-surface px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 22) }}>
        <Button label="Fermer" onPress={() => router.replace(REQUESTS_ROUTE)} />
      </View>
    </View>
  );
}

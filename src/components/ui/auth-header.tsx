import { Text, View } from "react-native";

import { ArrowLeftIcon } from "@/components/icons";
import { PressableScale } from "@/components/motion/pressable-scale";

type AuthHeaderProps = {
  onBack: () => void;
};

/** Back button + EduLoc wordmark, shared by the Login and Signup screens. */
export function AuthHeader({ onBack }: AuthHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-5 pb-[14px] pt-[18px]">
      <PressableScale onPress={onBack} accessibilityLabel="Retour">
        <View className="h-9 w-9 items-center justify-center rounded-full border border-line">
          <ArrowLeftIcon color="#14162B" />
        </View>
      </PressableScale>
      <Text className="text-[21px] font-bold text-ink">
        edU<Text className="text-primary">loc</Text>
      </Text>
    </View>
  );
}

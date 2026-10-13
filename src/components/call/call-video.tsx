import { View } from "react-native";

type CallVideoProps = {
  kind: "remote" | "local";
  attach: (el: unknown) => void;
};

/** Plateformes sans élément <video> : l'appel reste audio (la vidéo native demande un dev build LiveKit). */
export function CallVideo(_props: CallVideoProps) {
  return <View />;
}

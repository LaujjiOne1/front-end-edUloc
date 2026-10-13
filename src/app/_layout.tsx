import "../global.css";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { toAuthenticatedUser } from "@/api/mappers";
import { Session } from "@/api/session";
import { asyncStorageSession } from "@/api/session-storage";
import { RealtimeProvider } from "@/realtime/realtime-provider";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

// Démarré à l'import (avant le premier rendu d'un écran) : les requêtes authentifiées attendent
// Session.whenReady(). Le rendu serveur d'Expo Router (export web) n'a pas de `window` : on s'abstient.
if (typeof window !== "undefined") {
  Session.setStorage(asyncStorageSession);
  void AuthService.restoreSession()
    .then((user) => {
      if (user) useAuthStore.getState().setUser(user);
    })
    .catch(() => undefined); // hors ligne : on garde l'utilisateur persisté
}

/** Session → store : un profil rafraîchi met le store à jour ; une session perdue déconnecte l'UI. */
Session.subscribe((me) => {
  const store = useAuthStore.getState();
  if (me) store.setUser(toAuthenticatedUser(me));
  else store.sessionLost();
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RealtimeProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </RealtimeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

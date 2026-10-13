import type { Href } from "expo-router";

import { ConversationsListView } from "@/components/chat/conversations-list-view";
import { ApprentiBottomNav } from "@/components/ui/apprenti-bottom-nav";

function conversationRoute(bookingId: string): Href {
  return `/apprenti-dashboard/bookings/${bookingId}/conversation` as Href;
}

/** Conversations du demandeur : une par tuteur, avec aperçu du dernier message et non-lus. */
export function ConversationsListScreen() {
  return (
    <ConversationsListView
      tone="primary"
      subtitle="Échangez des messages vocaux et des documents avec vos tuteurs"
      emptyTitle="Aucune conversation active"
      emptyBody="Réservez un tuteur ou envoyez une demande pour échanger des vocaux et des documents."
      emptyAction={{ label: "Trouver un tuteur", route: "/search" as Href }}
      routeFor={conversationRoute}
      nav={<ApprentiBottomNav active="conversations" />}
    />
  );
}

import type { Href } from "expo-router";

import { ConversationsListView } from "@/components/chat/conversations-list-view";
import { TutorBottomNav } from "@/components/ui/tutor-bottom-nav";

function conversationRoute(bookingId: string): Href {
  return `/tutor-dashboard/appointments/${bookingId}/conversation` as Href;
}

/** Conversations du tuteur : une par demandeur, avec aperçu du dernier message et non-lus. */
export function TutorConversationsListScreen() {
  return (
    <ConversationsListView
      tone="violet"
      subtitle="Échangez des messages vocaux et des documents avec vos élèves"
      emptyTitle="Aucune conversation"
      emptyBody="Vous pourrez échanger avec vos élèves dès qu'une demande de cours ou un rendez-vous sera accepté."
      routeFor={conversationRoute}
      nav={<TutorBottomNav active="conversations" />}
    />
  );
}

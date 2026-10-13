import { type Href, useLocalSearchParams } from "expo-router";

import { ConversationView } from "@/components/chat/conversation-view";
import { useTutorBooking } from "@/hooks/use-tutor-booking";

function callRoute(id: string): Href {
  return `/tutor-dashboard/appointments/${id}/call` as Href;
}
function voiceRoute(id: string): Href {
  return `/tutor-dashboard/appointments/${id}/conversation/voice` as Href;
}
function documentsRoute(id: string): Href {
  return `/tutor-dashboard/appointments/${id}/conversation/documents` as Href;
}

/**
 * 63_TutorConversation : l'interlocuteur du tuteur est le DEMANDEUR (le parent / la personne qui réserve),
 * jamais un compte enfant (protection des mineurs) ; le bénéficiaire est rappelé dans le sous-titre.
 */
export function TutorAppointmentConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state: bookingState } = useTutorBooking(id);
  const booking = bookingState.status === "success" ? bookingState.booking : null;
  const confirmed = booking ? booking.status === "confirmed" || booking.status === "in_progress" : false;

  const requesterName = booking ? `${booking.requester.firstName} ${booking.requester.lastName}`.trim() : "";
  const initials = booking ? (booking.requester.firstName.slice(0, 1) + (booking.requester.lastName || "").slice(0, 1)).toUpperCase() : "";

  return (
    <ConversationView
      bookingId={id}
      initials={initials}
      title={requesterName || "Conversation"}
      tone="violet"
      statusLabel={
        booking ? `Pour ${booking.beneficiary.firstName} • ${confirmed ? "rendez-vous confirmé" : "en attente de confirmation"}` : null
      }
      statusPositive={confirmed}
      callRoute={callRoute(id ?? "")}
      voiceRoute={voiceRoute(id ?? "")}
      documentsRoute={documentsRoute(id ?? "")}
    />
  );
}

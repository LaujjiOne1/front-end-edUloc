import { type Href, useLocalSearchParams } from "expo-router";

import { TutorAvatar } from "@/components/ui/tutor-avatar";
import { ConversationView } from "@/components/chat/conversation-view";
import { useMyBooking } from "@/hooks/use-my-booking";

function callRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/call` as Href;
}
function voiceRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/conversation/voice` as Href;
}
function documentsRoute(id: string): Href {
  return `/apprenti-dashboard/bookings/${id}/conversation/documents` as Href;
}

/** 25_Conversation côté demandeur : l'interlocuteur est le tuteur. */
export function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state: bookingState } = useMyBooking(id);
  const booking = bookingState.status === "success" ? bookingState.booking : null;
  const confirmed = booking ? booking.status === "confirmed" || booking.status === "in_progress" : false;

  return (
    <ConversationView
      bookingId={id}
      initials={booking?.offer.tutorInitial ?? ""}
      avatar={booking ? <TutorAvatar gender={booking.offer.tutorGender} photoUrl={booking.offer.tutorPhotoUrl} size={38} /> : undefined}
      title={booking?.offer.tutorName ?? "Conversation"}
      tone="primary"
      statusLabel={booking ? (confirmed ? "Rendez-vous confirmé" : "En attente de confirmation") : null}
      statusPositive={confirmed}
      callRoute={callRoute(id ?? "")}
      voiceRoute={voiceRoute(id ?? "")}
      documentsRoute={documentsRoute(id ?? "")}
    />
  );
}

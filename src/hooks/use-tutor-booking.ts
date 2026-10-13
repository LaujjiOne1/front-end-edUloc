import { useCallback, useEffect, useState } from "react";

import { useRealtimeReload } from "@/realtime/use-realtime-event";
import { BookingService, BookingServiceError } from "@/services/booking.service";
import type { Booking } from "@/types/booking";

export type TutorBookingState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; booking: Booking };

/** Loads a single booking request by id for RequestDetail/RequestAccepted. */
export function useTutorBooking(id: string | undefined) {
  const [state, setState] = useState<TutorBookingState>({ status: "loading" });

  const load = useCallback(async (silent = false) => {
    if (!id) {
      setState({ status: "error", message: "Cette demande est introuvable." });
      return;
    }
    if (!silent) setState({ status: "loading" });
    try {
      const booking = await BookingService.getTutorBookingById(id);
      setState({ status: "success", booking });
    } catch (error) {
      if (silent) return;
      setState({
        status: "error",
        message: error instanceof BookingServiceError ? error.message : "Impossible de charger cette demande.",
      });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Annulation par le demandeur / auto-refus pendant que le tuteur consulte la demande.
  useRealtimeReload(() => void load(true), ["booking.", "session."]);

  // Identité stable : certains écrans relisent au focus (useFocusEffect) sans boucler.
  const retry = useCallback(() => load(), [load]);

  return { state, retry };
}

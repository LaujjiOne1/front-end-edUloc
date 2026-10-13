import { useCallback, useEffect, useState } from "react";

import { useRealtimeReload } from "@/realtime/use-realtime-event";
import { BookingService, BookingServiceError } from "@/services/booking.service";
import type { Booking } from "@/types/booking";

export type MyBookingState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; booking: Booking };

/** Loads a single one of the signed-in beneficiary's bookings by id — 23/24 and the whole conversation/session sub-flow. */
export function useMyBooking(id: string | undefined) {
  const [state, setState] = useState<MyBookingState>({ status: "loading" });

  const load = useCallback(async (silent = false) => {
    if (!id) {
      setState({ status: "error", message: "Ce rendez-vous est introuvable." });
      return;
    }
    if (!silent) setState({ status: "loading" });
    try {
      const booking = await BookingService.getMyBookingById(id);
      setState({ status: "success", booking });
    } catch (error) {
      if (silent) return;
      setState({
        status: "error",
        message: error instanceof BookingServiceError ? error.message : "Impossible de charger ce rendez-vous.",
      });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Le tuteur accepte / refuse / démarre / termine : l'écran suit sans action de l'utilisateur.
  useRealtimeReload(() => void load(true), ["booking.", "session."]);

  // Identité stable : certains écrans relisent au focus (useFocusEffect) sans boucler.
  const retry = useCallback(() => load(), [load]);

  return { state, retry };
}

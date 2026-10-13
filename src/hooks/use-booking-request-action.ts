import { useCallback, useState } from "react";

import { BookingService, BookingServiceError } from "@/services/booking.service";
import type { Booking } from "@/types/booking";

export type BookingRequestActionState =
  | { status: "idle" }
  | { status: "accepting" }
  | { status: "refusing" }
  | { status: "error"; message: string };

type AcceptResult = { ok: true; booking: Booking } | { ok: false; conflict: boolean };

/** Powers 53_TutorRequestDetail's "Accepter" / "Refuser" — PENDING → CONFIRMED | REFUSED. */
export function useBookingRequestAction() {
  const [state, setState] = useState<BookingRequestActionState>({ status: "idle" });

  const accept = useCallback(async (bookingId: string): Promise<AcceptResult> => {
    setState({ status: "accepting" });
    try {
      const booking = await BookingService.acceptBooking(bookingId);
      setState({ status: "idle" });
      return { ok: true, booking };
    } catch (error) {
      const isConflict = error instanceof BookingServiceError && error.code === "slot_unavailable";
      if (isConflict) {
        // Navigating to 55_TutorRequestConflict — no inline error to show here.
        setState({ status: "idle" });
      } else {
        setState({
          status: "error",
          message: error instanceof BookingServiceError ? error.message : "Impossible d'accepter cette demande.",
        });
      }
      return { ok: false, conflict: isConflict };
    }
  }, []);

  const refuse = useCallback(async (bookingId: string): Promise<Booking | null> => {
    setState({ status: "refusing" });
    try {
      const booking = await BookingService.refuseBooking(bookingId);
      setState({ status: "idle" });
      return booking;
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof BookingServiceError ? error.message : "Impossible de refuser cette demande.",
      });
      return null;
    }
  }, []);

  return { state, accept, refuse };
}

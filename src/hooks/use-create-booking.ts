import { useCallback, useState } from "react";

import { BookingService, BookingServiceError } from "@/services/booking.service";
import type { Booking, BookingRequest } from "@/types/booking";

export type CreateBookingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; booking: Booking };

/** Powers the 19_BookingSummary screen's "Envoyer la demande" submission. */
export function useCreateBooking() {
  const [state, setState] = useState<CreateBookingState>({ status: "idle" });

  const submit = useCallback(async (request: BookingRequest) => {
    setState({ status: "loading" });
    try {
      const booking = await BookingService.createBooking(request);
      setState({ status: "success", booking });
      return booking;
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof BookingServiceError
            ? error.message
            : "Impossible d'envoyer la demande. Réessayez.",
      });
      return null;
    }
  }, []);

  return { state, submit };
}

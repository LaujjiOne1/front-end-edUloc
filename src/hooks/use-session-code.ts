import { useCallback, useEffect, useState } from "react";

import { BookingService, BookingServiceError } from "@/services/booking.service";

export type SessionCodeState = { status: "loading" } | { status: "error"; message: string } | { status: "success"; code: string };

/** Loads the beneficiary's session code — 24_BookingConfirmed's preview and 29_SessionOTP. */
export function useSessionCode(bookingId: string | undefined) {
  const [state, setState] = useState<SessionCodeState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!bookingId) {
      setState({ status: "error", message: "Ce rendez-vous est introuvable." });
      return;
    }
    setState({ status: "loading" });
    try {
      const code = await BookingService.getSessionCode(bookingId);
      setState({ status: "success", code });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof BookingServiceError ? error.message : "Impossible de charger le code de séance.",
      });
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

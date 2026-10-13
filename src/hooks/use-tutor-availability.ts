import { useCallback, useEffect, useState } from "react";

import { AvailabilityService } from "@/services/availability.service";
import type { TutorAvailabilitySlot } from "@/types/availability";

export type TutorAvailabilityState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; availability: TutorAvailabilitySlot[] };

/** Loads the signed-in tutor's open availability for 56_TutorCalendar. */
export function useTutorAvailability() {
  const [state, setState] = useState<TutorAvailabilityState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const availability = await AvailabilityService.getAvailability();
      setState({ status: "success", availability });
    } catch {
      setState({ status: "error", message: "Impossible de charger votre calendrier." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

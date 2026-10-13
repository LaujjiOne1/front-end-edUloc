import { useCallback, useEffect, useState } from "react";

import { TutorService } from "@/services/tutor.service";
import type { TutorProfileSummary } from "@/types/tutor-profile";

export type TutorProfileState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; profile: TutorProfileSummary };

/** Loads the signed-in tutor's own profile for the Dashboard header and MyProfile screen. */
export function useTutorProfile() {
  const [state, setState] = useState<TutorProfileState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const profile = await TutorService.getMyProfile();
      setState({ status: "success", profile });
    } catch {
      setState({ status: "error", message: "Impossible de charger votre profil." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

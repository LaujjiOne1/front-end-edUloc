import { useCallback, useEffect, useState } from "react";

import { SearchService } from "@/services/search.service";
import type { AcademicTrack } from "@/types/track";

export type TracksState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; tracks: AcademicTrack[] };

/** Charge les séries (lycée, celles du niveau `levelName`) ou les mentions (université) de l'étape 2 de la recherche. */
export function useTracks(kind: "serie" | "mention" | null, levelName?: string) {
  const [state, setState] = useState<TracksState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!kind) return;
    setState({ status: "loading" });
    try {
      const tracks = await SearchService.getTracks(kind, levelName);
      setState(tracks.length > 0 ? { status: "success", tracks } : { status: "empty" });
    } catch {
      setState({ status: "error", message: "Impossible de charger les filières." });
    }
  }, [kind, levelName]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

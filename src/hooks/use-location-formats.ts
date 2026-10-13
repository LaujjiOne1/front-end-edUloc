import { useCallback, useEffect, useState } from "react";

import { SearchService } from "@/services/search.service";
import type { LocationFormatOption } from "@/types/search";

export type LocationFormatsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; formats: LocationFormatOption[] };

/** Loads the course delivery formats for the Location step. */
export function useLocationFormats() {
  const [state, setState] = useState<LocationFormatsState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const formats = await SearchService.getLocationFormats();
      setState(formats.length > 0 ? { status: "success", formats } : { status: "empty" });
    } catch {
      setState({ status: "error", message: "Impossible de charger les formats." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

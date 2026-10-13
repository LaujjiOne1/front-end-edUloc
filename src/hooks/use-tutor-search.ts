import { useCallback, useEffect, useState } from "react";

import { isApiError } from "@/api/errors";
import { LocationService } from "@/services/location.service";
import { TutorService } from "@/services/tutor.service";
import { type SearchWizardCriteria, toSearchCriteria } from "@/store/search-wizard.store";
import type { Tutor } from "@/types/tutor";

export type TutorsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; tutors: Tutor[] };

/** Loads tutors matching the wizard's search criteria for the Results / ResultsMap steps. */
export function useTutorSearch(criteria: SearchWizardCriteria) {
  const [state, setState] = useState<TutorsState>({ status: "loading" });
  /** Position du demandeur utilisée pour la recherche (adresse géocodée ou GPS) ; null pour une recherche en ligne. */
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      // The API needs coordinates for anything but a fully-online search
      // (D-12) — geocode the typed query when "use my position" wasn't used.
      let coordinates = criteria.location.coordinates;
      if (!coordinates && criteria.location.format !== "online" && criteria.location.query.trim()) {
        const geocoded = await LocationService.geocode(criteria.location.query.trim());
        coordinates = geocoded ? { latitude: geocoded.latitude, longitude: geocoded.longitude } : null;
      }
      setOrigin(criteria.location.format === "online" ? null : coordinates);
      const tutors = await TutorService.searchTutors(toSearchCriteria(criteria, coordinates));
      setState(tutors.length > 0 ? { status: "success", tutors } : { status: "empty" });
    } catch (error) {
      // Le message de l'API (« Indiquez un lieu… », « Connexion impossible… ») est plus utile qu'un texte générique.
      setState({
        status: "error",
        message: isApiError(error) ? error.message : "Impossible de charger les tuteurs.",
      });
    }
  }, [criteria]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load, origin };
}

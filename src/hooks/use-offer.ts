import { useCallback, useEffect, useState } from "react";

import { OfferService, OfferServiceError } from "@/services/offer.service";
import type { Offer } from "@/types/offer";

export type OfferState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; offer: Offer };

/** Loads a single offer by id for the OfferDetail screen. */
export function useOffer(id: string | undefined) {
  const [state, setState] = useState<OfferState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!id) {
      setState({ status: "error", message: "Cette offre est introuvable." });
      return;
    }
    setState({ status: "loading" });
    try {
      const offer = await OfferService.getOfferById(id);
      setState({ status: "success", offer });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof OfferServiceError ? error.message : "Impossible de charger cette offre.",
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

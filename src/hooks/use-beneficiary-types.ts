import { useCallback, useEffect, useState } from "react";

import { SearchService } from "@/services/search.service";
import type { BeneficiaryType } from "@/types/search";

export type BeneficiaryTypesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; beneficiaryTypes: BeneficiaryType[] };

/** Loads the beneficiary types for the "Pour qui recherchez-vous ?" step. */
export function useBeneficiaryTypes() {
  const [state, setState] = useState<BeneficiaryTypesState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const beneficiaryTypes = await SearchService.getBeneficiaryTypes();
      setState(beneficiaryTypes.length > 0 ? { status: "success", beneficiaryTypes } : { status: "empty" });
    } catch {
      setState({ status: "error", message: "Impossible de charger les options." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

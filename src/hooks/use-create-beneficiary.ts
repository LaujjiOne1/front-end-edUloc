import { useCallback, useState } from "react";

import { BeneficiaryService, BeneficiaryServiceError } from "@/services/beneficiary.service";
import type { CreateBeneficiaryInput, SavedBeneficiary } from "@/types/beneficiary";

export type CreateBeneficiaryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; beneficiary: SavedBeneficiary };

/** Powers 34_Beneficiaries' "Ajouter un bénéficiaire" form submission. */
export function useCreateBeneficiary() {
  const [state, setState] = useState<CreateBeneficiaryState>({ status: "idle" });

  const submit = useCallback(async (input: CreateBeneficiaryInput) => {
    setState({ status: "loading" });
    try {
      const beneficiary = await BeneficiaryService.createBeneficiary(input);
      setState({ status: "success", beneficiary });
      return beneficiary;
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof BeneficiaryServiceError ? error.message : "Impossible d'ajouter ce bénéficiaire.",
      });
      return null;
    }
  }, []);

  return { state, submit };
}

import type { TeachingModeId } from "@/types/booking";

/** Libellé court du mode d'enseignement d'un créneau (déterminé par le lieu de la plage, calculé par le serveur). */
export const TEACHING_MODE_LABELS: Record<TeachingModeId, string> = {
  online: "En ligne",
  at_home_beneficiary: "À domicile",
  at_home_tutor: "Chez le tuteur",
  public_place: "Lieu public",
};

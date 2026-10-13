import type { LevelRef, LocationFormatId } from "./common";

export type EducationLevel = LevelRef;

/** [v1~] id = RelationshipType en minuscules (SELF→"self", CHILD→"child"…) */
export interface BeneficiaryType {
  id: "self" | "child" | "spouse" | "sibling" | "parent" | "relative" | "other";
  label: string;
  description: string | null;
}

export interface LocationFormatOption {
  id: LocationFormatId;
  label: string;
}

/** [v1~] id = ObjectiveType en minuscules (D-06) */
export interface LearningObjective {
  id: "basics" | "remedial" | "exam_prep" | "excellence" | "ongoing" | "other";
  label: string;
}

export interface SearchCriteria {
  subjectId: string; // UUID Subject
  levelId?: string;
  beneficiaryType?: BeneficiaryType["id"];
  /** Texte saisi — affichage uniquement. L'API attend des coordonnées. */
  locationQuery?: string;
  /** [v1+] Coordonnées (géocodage ou position appareil) — requises si format ≠ online */
  coordinates?: { latitude: number; longitude: number } | null;
  radiusKm?: number; // [v1+]
  format?: LocationFormatId;
  objectiveId?: LearningObjective["id"];
}

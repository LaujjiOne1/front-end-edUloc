import { create } from "zustand";

import type { Category } from "@/types/category";
import type { LocationFormatId } from "@/types/common";
import type { BeneficiaryType, EducationLevel, LearningObjective, SearchCriteria } from "@/types/search";

export interface SearchWizardCriteria {
  subject: Category | null;
  level: EducationLevel | null;
  beneficiary: BeneficiaryType | null;
  location: {
    query: string;
    useCurrentPosition: boolean;
    format: LocationFormatId;
    coordinates: { latitude: number; longitude: number } | null;
  };
  objective: LearningObjective | null;
  detail: { note: string };
}

const INITIAL_CRITERIA: SearchWizardCriteria = {
  subject: null,
  level: null,
  beneficiary: null,
  location: { query: "", useCurrentPosition: false, format: "in_person", coordinates: null },
  objective: null,
  detail: { note: "" },
};

interface SearchWizardStore {
  criteria: SearchWizardCriteria;
  setSubject: (subject: Category) => void;
  setLevel: (level: EducationLevel) => void;
  setBeneficiary: (beneficiary: BeneficiaryType) => void;
  setLocationQuery: (query: string) => void;
  setCurrentPositionLabel: (label: string, coordinates: { latitude: number; longitude: number }) => void;
  /** Adresse saisie, résolue en coordonnées par le géocodage (≠ position GPS de l'appareil). */
  setGeocodedLocation: (label: string, coordinates: { latitude: number; longitude: number }) => void;
  setLocationFormat: (format: LocationFormatId) => void;
  setObjective: (objective: LearningObjective) => void;
  setDetailNote: (note: string) => void;
  reset: () => void;
}

/**
 * Holds the selections made across the Need → Level → ForWhom → Location →
 * Objective wizard so that navigating back and forth between those steps
 * never loses previously entered data. `reset()` is called from the Home
 * screen's "goToSearch" so every fresh search starts from a clean state.
 *
 * This keeps the rich display objects (Category, EducationLevel, ...) the
 * wizard screens already render — the flat `SearchCriteria` the API expects
 * (subjectId/levelId/coordinates...) is derived only at the point of calling
 * TutorService.searchTutors, via `toSearchCriteria` below.
 */
export const useSearchWizardStore = create<SearchWizardStore>((set) => ({
  criteria: INITIAL_CRITERIA,

  setSubject: (subject) => set((s) => ({ criteria: { ...s.criteria, subject } })),

  setLevel: (level) => set((s) => ({ criteria: { ...s.criteria, level } })),

  setBeneficiary: (beneficiary) => set((s) => ({ criteria: { ...s.criteria, beneficiary } })),

  setLocationQuery: (query) =>
    set((s) => ({
      criteria: {
        ...s.criteria,
        location: { ...s.criteria.location, query, useCurrentPosition: false, coordinates: null },
      },
    })),

  setCurrentPositionLabel: (label, coordinates) =>
    set((s) => ({
      criteria: {
        ...s.criteria,
        location: { ...s.criteria.location, query: label, useCurrentPosition: true, coordinates },
      },
    })),

  setGeocodedLocation: (label, coordinates) =>
    set((s) => ({
      criteria: {
        ...s.criteria,
        location: { ...s.criteria.location, query: label, useCurrentPosition: false, coordinates },
      },
    })),

  setLocationFormat: (format) =>
    set((s) => ({ criteria: { ...s.criteria, location: { ...s.criteria.location, format } } })),

  setObjective: (objective) => set((s) => ({ criteria: { ...s.criteria, objective } })),

  setDetailNote: (note) => set((s) => ({ criteria: { ...s.criteria, detail: { note } } })),

  reset: () => set({ criteria: INITIAL_CRITERIA }),
}));

/** Flattens the wizard's rich criteria into the shape TutorService.searchTutors expects. */
export function toSearchCriteria(
  criteria: SearchWizardCriteria,
  coordinates: { latitude: number; longitude: number } | null,
): SearchCriteria {
  return {
    subjectId: criteria.subject?.id ?? "",
    levelId: criteria.level?.id,
    beneficiaryType: criteria.beneficiary?.id,
    locationQuery: criteria.location.query.trim() || undefined,
    coordinates,
    format: criteria.location.format,
    objectiveId: criteria.objective?.id,
  };
}

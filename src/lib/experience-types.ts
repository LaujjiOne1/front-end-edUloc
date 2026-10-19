/**
 * Un seul formulaire d'expérience, avec un type à cocher. Les expériences d'enseignement et d'encadrement comptent
 * davantage pour le rapprochement tuteur / demande qu'un poste sans lien avec l'enseignement.
 */
export type TutorExperienceType = "enseignement" | "encadrement" | "professionnelle" | "academique" | "benevolat";

export type ExperienceBackendType = "TEACHING" | "SUPERVISION" | "PROFESSIONAL" | "ACADEMIC" | "VOLUNTEER";

export const EXPERIENCE_TYPES: { id: TutorExperienceType; label: string; backend: ExperienceBackendType; teaching: boolean }[] = [
  { id: "enseignement", label: "Enseignement / Soutien scolaire", backend: "TEACHING", teaching: true },
  { id: "encadrement", label: "Encadrement académique", backend: "SUPERVISION", teaching: true },
  { id: "professionnelle", label: "Professionnelle", backend: "PROFESSIONAL", teaching: false },
  { id: "academique", label: "Projet académique", backend: "ACADEMIC", teaching: false },
  { id: "benevolat", label: "Bénévolat", backend: "VOLUNTEER", teaching: false },
];

export const experienceTypeLabel = (id: TutorExperienceType): string =>
  EXPERIENCE_TYPES.find((t) => t.id === id)?.label ?? id;

export type ExperienceAudienceId = "primaire" | "college" | "lycee" | "universite";

/** `backend` = catégorie de niveau du catalogue (EducationLevel.category). */
export const EXPERIENCE_AUDIENCES: { id: ExperienceAudienceId; label: string; backend: "Primaire" | "Collège" | "Lycée" | "Université" }[] = [
  { id: "primaire", label: "Primaire", backend: "Primaire" },
  { id: "college", label: "Collège", backend: "Collège" },
  { id: "lycee", label: "Lycée", backend: "Lycée" },
  { id: "universite", label: "Université", backend: "Université" },
];

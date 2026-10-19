import { EXPERIENCE_TYPES } from "@/lib/experience-types";
import type { TutorExperienceEntry } from "@/store/tutor-application.store";

/**
 * Petits avertissements sur une expérience incomplète : l'information manque, mais rien ne bloque. Ceux de l'import de
 * CV (intitulé introuvable, date incertaine…) sont conservés tant que le tuteur n'a pas relu et enregistré l'entrée.
 */
export function experienceWarnings(entry: TutorExperienceEntry): string[] {
  const warnings: string[] = [];
  if (!entry.period.trim()) warnings.push("Période manquante : précisez quand, ou pendant combien de temps.");
  // Un projet académique n'a pas toujours de structure : ce n'est pas une information manquante.
  if (!entry.organization.trim() && entry.type !== "academique") warnings.push("Établissement, entreprise ou structure manquant(e).");
  const isTeaching = EXPERIENCE_TYPES.find((t) => t.id === entry.type)?.teaching;
  if (isTeaching && entry.audience.length === 0) warnings.push("Public encadré non précisé : primaire, collège, lycée ou université ?");
  if (isTeaching && !entry.subjects?.trim()) warnings.push("Matières enseignées non précisées : elles aident les élèves à vous trouver.");
  // Les avertissements de l'import qui disent déjà la même chose ne sont pas répétés.
  const importOnly = (entry.warnings ?? []).filter((w) => !/manquant|non précis/i.test(w));
  return [...warnings, ...importOnly];
}

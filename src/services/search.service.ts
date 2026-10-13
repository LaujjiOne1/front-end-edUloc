import { api } from "@/api/http";
import { toBeneficiaryType, toEducationLevel, toLocationFormat, toObjective } from "@/api/mappers";
import type { EducationLevelDto, ReferenceOptionsDto } from "@/api/contracts/dto";
import type { BeneficiaryType, EducationLevel, LearningObjective, LocationFormatOption } from "@/types/search";

/** Options enums : le backend ne fournit que les catalogues des matières et des niveaux. */
const referenceOptions: ReferenceOptionsDto = {
  relationships: [
    { value: "SELF", label: "Pour moi" },
    { value: "CHILD", label: "Mon enfant" },
    { value: "RELATIVE", label: "Un proche" },
    { value: "OTHER", label: "Autre personne" },
    { value: "SPOUSE", label: "Mon conjoint" },
    { value: "SIBLING", label: "Mon frère / ma sœur" },
    { value: "PARENT", label: "Mon parent" },
  ],
  objectives: [
    { value: "REMEDIAL", label: "Remise à niveau" },
    { value: "ONGOING", label: "Accompagnement régulier" },
    { value: "EXCELLENCE", label: "Approfondir" },
  ],
  difficulties: [
    { value: "THEORETICAL", label: "Compréhension théorique" },
    { value: "PRACTICAL", label: "Mise en pratique" },
    { value: "METHODOLOGICAL", label: "Méthode de travail" },
    { value: "CONFIDENCE", label: "Confiance en soi" },
    { value: "OTHER", label: "Autre" },
  ],
  formats: [
    { value: "IN_PERSON", label: "En présentiel" },
    { value: "ONLINE", label: "En ligne" },
    { value: "BOTH", label: "Les deux" },
  ],
  rhythms: [
    { value: "ONE_TIME", label: "Ponctuel" },
    { value: "OCCASIONAL", label: "Occasionnel" },
    { value: "REGULAR", label: "Régulier" },
    { value: "INTENSIVE", label: "Intensif" },
  ],
  teachingModes: [
    { value: "ONLINE", label: "En ligne" },
    { value: "AT_HOME_BENEFICIARY", label: "Au domicile du bénéficiaire" },
    { value: "AT_HOME_TUTOR", label: "Chez le tuteur" },
    { value: "PUBLIC_PLACE", label: "Lieu public" },
  ],
};

/** Les 4 choix affichés par l'étape « Pour qui ? » du wizard. */
const WIZARD_RELATIONSHIPS = ["SELF", "CHILD", "RELATIVE", "OTHER"];

export const SearchService = {
  async getLevels(): Promise<EducationLevel[]> {
    return (await api.get<EducationLevelDto[]>("/catalog/education-levels", undefined, { auth: false })).map(toEducationLevel);
  },
  async getBeneficiaryTypes(): Promise<BeneficiaryType[]> {
    return referenceOptions.relationships.filter((r) => WIZARD_RELATIONSHIPS.includes(r.value)).map(toBeneficiaryType);
  },
  async getLocationFormats(): Promise<LocationFormatOption[]> {
    return referenceOptions.formats.map(toLocationFormat);
  },
  async getObjectives(): Promise<LearningObjective[]> {
    return referenceOptions.objectives.map(toObjective);
  },
  /** [v1+] Toutes les options (difficultés, rythmes, modes d'enseignement…). */
  async getReferenceOptions(): Promise<ReferenceOptionsDto> {
    return referenceOptions;
  },
};

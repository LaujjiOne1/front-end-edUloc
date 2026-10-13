import { api } from "@/api/http";
import { ApiError } from "@/api/errors";
import { formatToDto, toTutorFromPublic, toTutorFromSearch, toTutorProfileSummary } from "@/api/mappers";
import type { SearchResultDto, TutorPrivateDto, TutorPublicDto } from "@/api/contracts/dto";
import type { SearchCriteria } from "@/types/search";
import type { Tutor } from "@/types/tutor";
import type { TutorProfileSummary } from "@/types/tutor-profile";

export { ApiError as TutorServiceError };

/** Rayon de recherche par défaut (le serveur élargit à la zone de déplacement du tuteur si elle est plus grande). */
const DEFAULT_RADIUS_M = 10_000;

/**
 * Routes backend : GET /search/offers, GET /search/tutors/:id, GET /tutors/me/profile
 * (identité du tuteur connecté : useAuthStore().user.tutor.tutorProfileId).
 */
export const TutorService = {
  /**
   * format = "online"   → offres à distance, aucune coordonnée requise ;
   * format = "in_person"/"both" → coordonnées obligatoires pour le présentiel (le serveur répond 400 sinon).
   */
  async searchTutors(criteria: SearchCriteria): Promise<Tutor[]> {
    const format = criteria.format ?? "both";
    const needsPosition = format !== "online";
    if (needsPosition && !criteria.coordinates) {
      throw ApiError.local("validation_error", "Indiquez un lieu pour trouver des tuteurs près de chez vous.");
    }
    const results = await api.get<SearchResultDto[]>(
      "/search/offers",
      {
        subjectId: criteria.subjectId,
        levelId: criteria.levelId,
        format: formatToDto(format),
        // Coordonnées décimales telles quelles : le cache serveur les arrondit lui-même à ~500 m.
        lat: needsPosition ? criteria.coordinates?.latitude : undefined,
        lng: needsPosition ? criteria.coordinates?.longitude : undefined,
        radiusM: criteria.radiusKm === undefined ? DEFAULT_RADIUS_M : Math.round(criteria.radiusKm * 1000),
        limit: 20,
      },
      { auth: false },
    );
    return results.map(toTutorFromSearch);
  },

  async getTutorById(id: string): Promise<Tutor> {
    return toTutorFromPublic(await api.get<TutorPublicDto>(`/search/tutors/${id}`, undefined, { auth: false }));
  },

  async getMyProfile(): Promise<TutorProfileSummary> {
    return toTutorProfileSummary(await api.get<TutorPrivateDto>("/tutors/me/profile"));
  },
};

import { api, uuid } from "@/api/http";
import { ApiError } from "@/api/errors";
import { toBooking, upper } from "@/api/mappers";
import { Realtime } from "@/realtime/realtime-client";
import type {
  BookingDto,
  BackendCreateBookingRequestDto,
  BookingOtpDto,
  BookingStatus as BookingStatusDto,
  TeachingMode,
} from "@/api/contracts/dto";
import type { Booking, BookingRequest, BookingStatus } from "@/types/booking";

export { ApiError as BookingServiceError };

/** « 482913 » → « 482 913 » (affichage 24/29) */
const spaced = (otp: string) => `${otp.slice(0, 3)} ${otp.slice(3)}`;

/** GET /bookings?role=…&status=A,B — une seule requête par vue (le serveur accepte une liste de statuts). */
/** Après toute mutation réussie, les listes et détails ouverts (tableaux de bord, calendrier…) se relisent aussitôt. */
function changed(booking: Booking): Booking {
  Realtime.emitLocal("booking.local.changed", booking.id);
  return booking;
}

async function list(role: "requester" | "tutor", status?: BookingStatus[]): Promise<Booking[]> {
  const statuses = status?.map((value) => upper(value) as BookingStatusDto);
  const rows = await api.get<BookingDto[]>("/bookings", { role, status: statuses?.length ? statuses.join(",") : undefined, limit: 100 });
  return rows.map(toBooking);
}

/**
 * Routes : POST /bookings, GET /bookings/:id, GET /bookings?role=requester|tutor,
 *          POST /bookings/:id/{accept|refuse|cancel|start|complete}, GET /bookings/:id/otp
 * Machine d'états : PENDING → CONFIRMED → IN_PROGRESS → COMPLETED (+ REFUSED, CANCELLED).
 */
export const BookingService = {
  // ---------------- Demandeur ----------------
  /** Le backend identifie la disponibilité depuis l'offre, l'heure et le lieu. */
  async createBooking(request: BookingRequest): Promise<Booking> {
    const idempotencyKey = request.idempotencyKey ?? uuid();
    const body: BackendCreateBookingRequestDto = {
      offerId: request.offerId,
      beneficiaryId: request.beneficiaryId,
      startAt: request.slot.startAt,
      teachingMode: upper(request.teachingMode) as TeachingMode,
      placeId: request.slot.placeId,
      beneficiaryAddress: request.beneficiaryAddress,
      requesterNote: request.note,
    };
    return changed(toBooking(await api.post<BookingDto>("/bookings", body, { headers: { "Idempotency-Key": idempotencyKey } })));
  },

  /** [v1~] plus de paramètre : réservations du compte connecté. Filtrer par onglet via `status`. */
  async getMyBookings(status?: BookingStatus[]): Promise<Booking[]> {
    return list("requester", status);
  },

  /** Détail — même route pour le demandeur et le tuteur (viewerRole dans la réponse). */
  async getBookingById(id: string): Promise<Booking> {
    return toBooking(await api.get<BookingDto>(`/bookings/${id}`));
  },
  /** @deprecated alias → getBookingById */
  getMyBookingById(id: string) {
    return BookingService.getBookingById(id);
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    return changed(toBooking(await api.post<BookingDto>(`/bookings/${bookingId}/cancel`, { reason })));
  },

  /** Code à lire au tuteur (29_SessionOTP). Format affiché « 482 913 ». */
  async getSessionCode(bookingId: string): Promise<string> {
    return spaced((await api.get<BookingOtpDto>(`/bookings/${bookingId}/otp`)).otp);
  },

  // ---------------- Tuteur ----------------
  /** [v1~] plus de paramètre tutorId. */
  async getTutorBookings(status?: BookingStatus[]): Promise<Booking[]> {
    return list("tutor", status);
  },
  /** @deprecated alias → getBookingById */
  getTutorBookingById(id: string) {
    return BookingService.getBookingById(id);
  },
  /** 409 slot_unavailable → 55_TutorRequestConflict */
  async acceptBooking(bookingId: string): Promise<Booking> {
    return changed(toBooking(await api.post<BookingDto>(`/bookings/${bookingId}/accept`)));
  },
  async refuseBooking(bookingId: string, reason?: string): Promise<Booking> {
    return changed(toBooking(await api.post<BookingDto>(`/bookings/${bookingId}/refuse`, { reason })));
  },
  /**
   * CONFIRMED → IN_PROGRESS. D-09 : `code` obligatoire en présentiel, facultatif en ligne.
   * Erreurs : otp_invalid (422), otp_locked, invalid_state.
   */
  async startTutorSession(bookingId: string, code?: string): Promise<Booking> {
    const otp = code?.replace(/\s/g, "") || undefined;
    if (!otp) throw ApiError.local("validation_error", "Le code de démarrage est requis par le serveur.");
    return changed(toBooking(await api.post<BookingDto>(`/bookings/${bookingId}/start`, { otp })));
  },
  /** @deprecated D-09 : le présentiel exige maintenant le code → startTutorSession(id, code) */
  startTutorPresentialSession(bookingId: string, code: string) {
    return BookingService.startTutorSession(bookingId, code);
  },
  async completeTutorSession(bookingId: string): Promise<Booking> {
    return changed(toBooking(await api.post<BookingDto>(`/bookings/${bookingId}/complete`)));
  },
};
/* Supprimés :
 *  - startSession / completeSession côté demandeur : le TDD réserve ces transitions au TUTEUR (D-08).
 *  - CURRENT_BENEFICIARY_ID → Session.getUser().selfBeneficiaryId
 */

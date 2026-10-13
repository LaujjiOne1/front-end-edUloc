import { useCallback, useEffect, useRef, useState } from "react";

import { localDate } from "@/api/format/datetime";
import { OfferService } from "@/services/offer.service";
import type { Offer, OfferSlot } from "@/types/offer";

/** Le serveur calcule les créneaux par fenêtre de 31 jours maximum. */
const CHUNK_DAYS = 31;
/** Horizon de réservation proposé : ~6 mois. */
const MAX_CHUNKS = 6;

const DAY_MS = 86_400_000;
/** Nombre de jours entre aujourd'hui (même référence que le service : date locale) et `iso`. */
const dayIndex = (iso: string) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${localDate(new Date().toISOString())}T00:00:00Z`)) / DAY_MS);

/**
 * Créneaux d'une offre sur un calendrier : fenêtres de 31 jours chargées à la demande, quand le demandeur
 * parcourt les semaines / les mois (la première est chargée à l'ouverture). `ensureRange` est sans effet
 * sur les fenêtres déjà chargées ou en cours. L'état vit avec l'écran : une autre offre monte un autre écran.
 */
export function useOfferSlots(offer: Offer | null) {
  const [chunks, setChunks] = useState<Record<number, OfferSlot[]>>({});
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(new Set<number>());

  const load = useCallback(
    (chunk: number) => {
      if (!offer || requested.current.has(chunk)) return;
      requested.current.add(chunk);
      setPending((n) => n + 1);
      OfferService.getOfferSlots(offer.tutorId, offer.id, CHUNK_DAYS, offer.durationMinutes, chunk * CHUNK_DAYS)
        .then((slots) => setChunks((current) => ({ ...current, [chunk]: slots })))
        .catch(() => {
          requested.current.delete(chunk); // on pourra réessayer en naviguant à nouveau
          setError("Impossible de charger les créneaux. Réessayez.");
        })
        .finally(() => setPending((n) => n - 1));
    },
    [offer],
  );

  const ensureRange = useCallback(
    ({ from, to }: { from: string; to: string }) => {
      const first = Math.max(0, Math.floor(dayIndex(from) / CHUNK_DAYS));
      const last = Math.min(MAX_CHUNKS - 1, Math.floor(dayIndex(to) / CHUNK_DAYS));
      for (let chunk = first; chunk <= last; chunk += 1) load(chunk);
    },
    [load],
  );

  // La première fenêtre est toujours chargée (date initiale, « prochaine disponibilité »).
  useEffect(() => {
    load(0);
  }, [load]);

  const slots = Object.keys(chunks)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((chunk) => chunks[chunk]);

  const retry = useCallback(() => {
    setError(null);
    load(0);
  }, [load]);

  return { slots, loading: pending > 0, error, ensureRange, retry };
}

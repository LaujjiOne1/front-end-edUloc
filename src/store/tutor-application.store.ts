import { create } from "zustand";

import type { LocationFormatId, TutorGender } from "@/types/common";
import type { EducationLevel } from "@/types/search";
import type { LocalFile } from "@/types/message";
import { canTeachLevel } from "@/lib/degree-policy";
import type { TutorApplication, TutorDocumentKind, TutorSkill } from "@/types/tutor-application";

/**
 * UI-only types for the onboarding wizard's offer/location/availability steps.
 *
 * Draft values are submitted together with the tutor application; the server
 * stores them in the tutor profile and its related offer/place/availability
 * records before the application is reviewed.
 */
export interface TutorIdentityFields {
  firstName: string;
  lastName: string;
  /** Sexe : choisit la silhouette par défaut du tuteur (sans photo). */
  gender: TutorGender | null;
  birthDate: string;
  phone: string;
  email: string;
}

export type TutorExperienceType = "professionnelle" | "academique";

export interface TutorExperienceEntry {
  id: string;
  type: TutorExperienceType;
  title: string;
  organization: string;
  period: string;
  description?: string;
}

export type EducationDegreeId = "bac" | "licence" | "master" | "doctorat" | "other";

export interface EducationDegree {
  id: EducationDegreeId;
  label: string;
}

export interface TutorBackgroundFields {
  degree: EducationDegree | null;
  field: string;
  institution: string;
  experience: string;
  experiences: TutorExperienceEntry[];
}

export interface TutorSubjectLevels {
  skill: TutorSkill;
  levels: EducationLevel[];
}

export type OfferDurationId = "45m" | "1h" | "1h30" | "2h" | "3h";

export interface OfferDuration {
  id: OfferDurationId;
  label: string;
  hours: number;
}

export interface TutorOfferDraft {
  id: string;
  skill: TutorSkill | null;
  level: EducationLevel | null;
  title: string;
  description: string;
  duration: OfferDuration | null;
  hourlyRate: number;
  priceCalculated: number;
}

export interface TutorLocationEntry {
  id: string;
  label: string;
  radiusKm: number;
  isPrimary: boolean;
  /** Coordonnées géocodées : la recherche de tuteurs est géographique (un lieu sans coordonnées n'est jamais trouvé). */
  latitude: number;
  longitude: number;
}

/** Tarif horaire proposé par défaut, en ariary (Ar). */
export const DEFAULT_HOURLY_RATE = 20_000;

export interface TutorAvailabilityEntry {
  id: string;
  dateLabel: string;
  timeRangeLabel: string;
  format: LocationFormatId;
  locationLabel: string | null;
}

export interface WeeklyDaySlot {
  id: string;
  startTime: string;
  endTime: string;
  format: LocationFormatId;
}

export interface WeeklyDayAvailability {
  dayId: string;
  dayLabel: string;
  active: boolean;
  slots: WeeklyDaySlot[];
}

/** Disponibilité ponctuelle : un jour précis (AAAA-MM-JJ), une seule fois — par opposition à la grille hebdomadaire. */
export interface DateSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  format: LocationFormatId;
}

export interface TutorDocumentEntry {
  kind: TutorDocumentKind;
  label: string;
  provided: boolean;
  fileName?: string;
  fileSize?: string;
  file?: LocalFile;
}

export interface TutorIntroVideo {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
  duration: number | null;
}

const INITIAL_IDENTITY: TutorIdentityFields = {
  firstName: "",
  lastName: "",
  gender: null,
  birthDate: "",
  phone: "",
  email: "",
};

const INITIAL_BACKGROUND: TutorBackgroundFields = {
  degree: null,
  field: "",
  institution: "",
  experience: "",
  experiences: [],
};

export const createDefaultOffer = (id = "offer-1"): TutorOfferDraft => ({
  id,
  skill: null,
  level: null,
  title: "",
  description: "",
  duration: { id: "1h", label: "1 heure", hours: 1 },
  hourlyRate: DEFAULT_HOURLY_RATE,
  priceCalculated: DEFAULT_HOURLY_RATE,
});

const INITIAL_DOCUMENTS: TutorDocumentEntry[] = [
  { kind: "identity", label: "Pièce justificative (CNI / Passeport)", provided: false },
  { kind: "diploma", label: "Diplôme le plus élevé", provided: false },
  { kind: "other", label: "Autre document (CV / Certification)", provided: false },
];

/** Aucun lieu par défaut : le tuteur choisit sa vraie zone (adresse géocodée). */
const INITIAL_LOCATIONS: TutorLocationEntry[] = [];

/** Grille vide au départ : aucun jour coché, aucun créneau — le tuteur coche ses jours puis ajoute ses plages. */
export const INITIAL_WEEKLY_AVAILABILITY: WeeklyDayAvailability[] = [
  { dayId: "mon", dayLabel: "Lundi", active: false, slots: [] },
  { dayId: "tue", dayLabel: "Mardi", active: false, slots: [] },
  { dayId: "wed", dayLabel: "Mercredi", active: false, slots: [] },
  { dayId: "thu", dayLabel: "Jeudi", active: false, slots: [] },
  { dayId: "fri", dayLabel: "Vendredi", active: false, slots: [] },
  { dayId: "sat", dayLabel: "Samedi", active: false, slots: [] },
  { dayId: "sun", dayLabel: "Dimanche", active: false, slots: [] },
];

interface TutorApplicationStore {
  identity: TutorIdentityFields;
  background: TutorBackgroundFields;
  skills: TutorSkill[];
  subjectLevels: TutorSubjectLevels[];
  bio: string;
  introVideo: TutorIntroVideo | null;
  offer: TutorOfferDraft;
  offers: TutorOfferDraft[];
  activeOfferIndex: number;
  formats: LocationFormatId[];
  locations: TutorLocationEntry[];
  availability: TutorAvailabilityEntry[];
  weeklyAvailability: WeeklyDayAvailability[];
  dateAvailability: DateSlot[];
  documents: TutorDocumentEntry[];
  application: TutorApplication | null;
  isPendingValidation: boolean;

  setIdentity: (fields: Partial<TutorIdentityFields>) => void;
  setBackground: (fields: Partial<TutorBackgroundFields>) => void;
  addExperience: (entry: Omit<TutorExperienceEntry, "id">) => void;
  updateExperience: (id: string, entry: Partial<TutorExperienceEntry>) => void;
  removeExperience: (id: string) => void;
  toggleSkill: (skill: TutorSkill) => void;
  /** Ajoute une compétence (sans doublon) — choisie dans les suggestions ou créée librement. */
  addSkill: (skill: TutorSkill) => void;
  setSkillScope: (skillId: string, scope: string) => void;
  toggleSubjectLevel: (skill: TutorSkill, level: EducationLevel) => void;
  setBio: (bio: string) => void;
  setIntroVideo: (video: TutorIntroVideo | null) => void;
  setOffer: (fields: Partial<TutorOfferDraft>) => void;
  updateOfferAtIndex: (index: number, fields: Partial<TutorOfferDraft>) => void;
  addNewOffer: () => void;
  removeOfferAtIndex: (index: number) => void;
  setActiveOfferIndex: (index: number) => void;
  toggleFormat: (format: LocationFormatId) => void;
  updatePrimaryRadius: (radiusKm: number) => void;
  /** Définit (ou remplace) la zone principale à partir d'une adresse géocodée. */
  setPrimaryLocation: (label: string, coordinates: { latitude: number; longitude: number }, radiusKm?: number) => void;
  addSecondaryLocation: (label: string, radiusKm: number, coordinates: { latitude: number; longitude: number }) => void;
  removeLocation: (id: string) => void;
  toggleWeeklyDay: (dayId: string) => void;
  addWeeklySlot: (dayId: string, startTime: string, endTime: string, format?: LocationFormatId) => void;
  removeWeeklySlot: (dayId: string, slotId: string) => void;
  addDateSlot: (date: string, startTime: string, endTime: string, format: LocationFormatId) => void;
  removeDateSlot: (slotId: string) => void;
  removeDocumentFile: (kind: TutorDocumentKind) => void;
  attachDocumentFile: (kind: TutorDocumentKind, file: LocalFile, fileSize: string) => void;
  setApplication: (application: TutorApplication) => void;
  setIsPendingValidation: (val: boolean) => void;
  reset: () => void;
}

export const useTutorApplicationStore = create<TutorApplicationStore>((set) => ({
  identity: INITIAL_IDENTITY,
  background: INITIAL_BACKGROUND,
  skills: [],
  subjectLevels: [],
  bio: "",
  introVideo: null,
  offer: createDefaultOffer(),
  offers: [createDefaultOffer()],
  activeOfferIndex: 0,
  formats: [],
  locations: INITIAL_LOCATIONS,
  availability: [],
  weeklyAvailability: INITIAL_WEEKLY_AVAILABILITY,
  dateAvailability: [],
  documents: INITIAL_DOCUMENTS,
  application: null,
  isPendingValidation: false,

  setIdentity: (fields) => set((s) => ({ identity: { ...s.identity, ...fields } })),

  setBackground: (fields) =>
    set((s) => {
      const background = { ...s.background, ...fields };
      if (!fields.degree || fields.degree.id === s.background.degree?.id) return { background };
      // Le diplôme borne les niveaux enseignables : on retire ceux que le nouveau diplôme n'autorise plus.
      const degreeId = fields.degree.id;
      const subjectLevels = s.subjectLevels.map((sl) => ({ ...sl, levels: sl.levels.filter((l) => canTeachLevel(degreeId, l)) }));
      const offers = s.offers.map((o) => (o.level && !canTeachLevel(degreeId, o.level) ? { ...o, level: null } : o));
      return { background, subjectLevels, offers, offer: offers[s.activeOfferIndex] ?? s.offer };
    }),

  addExperience: (entry) =>
    set((s) => {
      const newEntry: TutorExperienceEntry = {
        ...entry,
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      const experiences = [...(s.background.experiences ?? []), newEntry];
      return {
        background: {
          ...s.background,
          experiences,
          experience: experiences.map((e) => `${e.title} (${e.organization})`).join(", "),
        },
      };
    }),

  updateExperience: (id, fields) =>
    set((s) => {
      const experiences = (s.background.experiences ?? []).map((exp) =>
        exp.id === id ? { ...exp, ...fields } : exp
      );
      return {
        background: {
          ...s.background,
          experiences,
          experience: experiences.map((e) => `${e.title} (${e.organization})`).join(", "),
        },
      };
    }),

  removeExperience: (id) =>
    set((s) => {
      const experiences = (s.background.experiences ?? []).filter((exp) => exp.id !== id);
      return {
        background: {
          ...s.background,
          experiences,
          experience: experiences.map((e) => `${e.title} (${e.organization})`).join(", "),
        },
      };
    }),

  toggleSkill: (skill) =>
    set((s) => {
      const exists = s.skills.some((sk) => sk.id === skill.id);
      const newSkills = exists ? s.skills.filter((sk) => sk.id !== skill.id) : [...s.skills, skill];
      return {
        skills: newSkills,
        subjectLevels: exists ? s.subjectLevels.filter((sl) => sl.skill.id !== skill.id) : s.subjectLevels,
      };
    }),

  addSkill: (skill) =>
    set((s) => (s.skills.some((sk) => sk.id === skill.id) ? s : { skills: [...s.skills, skill] })),

  setSkillScope: (skillId, scope) =>
    set((s) => {
      const withScope = (sk: TutorSkill): TutorSkill => (sk.id === skillId ? { ...sk, scope } : sk);
      return {
        skills: s.skills.map(withScope),
        subjectLevels: s.subjectLevels.map((sl) => ({ ...sl, skill: withScope(sl.skill) })),
        offers: s.offers.map((o) => (o.skill ? { ...o, skill: withScope(o.skill) } : o)),
        offer: s.offer.skill ? { ...s.offer, skill: withScope(s.offer.skill) } : s.offer,
      };
    }),

  toggleSubjectLevel: (skill, level) =>
    set((s) => {
      const index = s.subjectLevels.findIndex((sl) => sl.skill.id === skill.id);
      if (index === -1) {
        return { subjectLevels: [...s.subjectLevels, { skill, levels: [level] }] };
      }
      const entry = s.subjectLevels[index];
      const hasLevel = entry.levels.some((l) => l.id === level.id);
      const levels = hasLevel ? entry.levels.filter((l) => l.id !== level.id) : [...entry.levels, level];
      const next = [...s.subjectLevels];
      next[index] = { ...entry, levels };
      return { subjectLevels: next };
    }),

  setBio: (bio) => set({ bio }),

  setIntroVideo: (introVideo) => set({ introVideo }),

  setOffer: (fields) =>
    set((s) => {
      const updated = { ...s.offer, ...fields };
      const hours = updated.duration?.hours ?? 1;
      const rate = updated.hourlyRate ?? DEFAULT_HOURLY_RATE;
      updated.priceCalculated = Math.round(hours * rate);
      const newOffers = [...s.offers];
      newOffers[s.activeOfferIndex] = updated;
      return { offer: updated, offers: newOffers };
    }),

  updateOfferAtIndex: (index, fields) =>
    set((s) => {
      const target = s.offers[index] ?? createDefaultOffer(`offer-${index + 1}`);
      const updated = { ...target, ...fields };
      const hours = updated.duration?.hours ?? 1;
      const rate = updated.hourlyRate ?? DEFAULT_HOURLY_RATE;
      updated.priceCalculated = Math.round(hours * rate);
      const newOffers = [...s.offers];
      newOffers[index] = updated;
      return {
        offers: newOffers,
        offer: index === s.activeOfferIndex ? updated : s.offer,
      };
    }),

  addNewOffer: () =>
    set((s) => {
      const newId = `offer-${s.offers.length + 1}`;
      const freshOffer = createDefaultOffer(newId);
      return {
        offers: [...s.offers, freshOffer],
        activeOfferIndex: s.offers.length,
        offer: freshOffer,
      };
    }),

  removeOfferAtIndex: (index) =>
    set((s) => {
      if (s.offers.length <= 1) return s;
      const newOffers = s.offers.filter((_, i) => i !== index);
      const nextIndex = Math.min(s.activeOfferIndex, newOffers.length - 1);
      return {
        offers: newOffers,
        activeOfferIndex: nextIndex,
        offer: newOffers[nextIndex],
      };
    }),

  setActiveOfferIndex: (index) =>
    set((s) => {
      if (index >= 0 && index < s.offers.length) {
        return { activeOfferIndex: index, offer: s.offers[index] };
      }
      return s;
    }),

  toggleFormat: (format) =>
    set((s) => ({
      formats: s.formats.includes(format) ? s.formats.filter((f) => f !== format) : [...s.formats, format],
    })),

  updatePrimaryRadius: (radiusKm) =>
    set((s) => ({
      locations: s.locations.map((loc) => (loc.isPrimary ? { ...loc, radiusKm } : loc)),
    })),

  setPrimaryLocation: (label, coordinates, radiusKm = 10) =>
    set((s) => {
      const previous = s.locations.find((loc) => loc.isPrimary);
      const primary: TutorLocationEntry = {
        id: previous?.id ?? "loc-main",
        label,
        radiusKm: previous?.radiusKm ?? radiusKm,
        isPrimary: true,
        ...coordinates,
      };
      return { locations: [primary, ...s.locations.filter((loc) => !loc.isPrimary)] };
    }),

  addSecondaryLocation: (label, radiusKm, coordinates) =>
    set((s) => ({
      locations: [...s.locations, { id: `loc-${Date.now()}`, label, radiusKm, isPrimary: false, ...coordinates }],
    })),

  removeLocation: (id) =>
    set((s) => ({
      locations: s.locations.filter((loc) => loc.id !== id || loc.isPrimary),
    })),

  toggleWeeklyDay: (dayId) =>
    set((s) => ({
      weeklyAvailability: s.weeklyAvailability.map((d) => (d.dayId === dayId ? { ...d, active: !d.active } : d)),
    })),

  addWeeklySlot: (dayId, startTime, endTime, format = "in_person") =>
    set((s) => ({
      weeklyAvailability: s.weeklyAvailability.map((d) =>
        d.dayId === dayId
          ? {
              ...d,
              active: true,
              slots: [...d.slots, { id: `slot-${Date.now()}`, startTime, endTime, format }],
            }
          : d,
      ),
    })),

  removeWeeklySlot: (dayId, slotId) =>
    set((s) => ({
      weeklyAvailability: s.weeklyAvailability.map((d) =>
        d.dayId === dayId ? { ...d, slots: d.slots.filter((slot) => slot.id !== slotId) } : d,
      ),
    })),

  addDateSlot: (date, startTime, endTime, format) =>
    set((s) => ({
      dateAvailability: [
        ...s.dateAvailability,
        { id: `date-slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, date, startTime, endTime, format },
      ].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    })),

  removeDateSlot: (slotId) => set((s) => ({ dateAvailability: s.dateAvailability.filter((slot) => slot.id !== slotId) })),

  removeDocumentFile: (kind) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.kind === kind ? { ...d, provided: false, file: undefined, fileName: undefined, fileSize: undefined } : d,
      ),
    })),

  attachDocumentFile: (kind, file, fileSize) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.kind === kind
          ? { ...d, provided: true, file, fileName: file.fileName, fileSize }
          : d,
      ),
    })),

  setApplication: (application) => set({ application }),

  setIsPendingValidation: (val) => set({ isPendingValidation: val }),

  reset: () =>
    set({
      identity: INITIAL_IDENTITY,
      background: INITIAL_BACKGROUND,
      skills: [],
      subjectLevels: [],
      bio: "",
      introVideo: null,
      offer: createDefaultOffer(),
      offers: [createDefaultOffer()],
      activeOfferIndex: 0,
      formats: [],
      locations: INITIAL_LOCATIONS,
      availability: [],
      weeklyAvailability: INITIAL_WEEKLY_AVAILABILITY,
      dateAvailability: [],
      documents: INITIAL_DOCUMENTS,
      application: null,
      isPendingValidation: false,
    }),
}));

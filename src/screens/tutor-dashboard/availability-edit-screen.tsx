import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
// TimeRangeWheelPicker is a native vertical wheel right inside this scroll
// view — react-native-gesture-handler's ScrollView is needed so its own
// vertical scroll gesture correctly yields to the wheel's GestureDetector
// instead of swallowing the drag (plain RN ScrollView doesn't participate in
// RNGH's gesture arbitration).
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ClockIcon,
  PlusIcon,
  XIcon,
} from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { RecurringDayCard } from "@/components/availability/recurring-day-card";
import { SlotModal } from "@/components/availability/slot-modal";
import { markersFromOccurrences } from "@/components/ui/day-agenda";
import { HabitCalendar } from "@/components/ui/habit-calendar";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { type SelectOption, SelectField } from "@/components/ui/select-field";
import { TimeRangeWheelPicker } from "@/components/ui/time-range-wheel-picker";
import { useAvailabilityActions } from "@/hooks/use-availability-actions";
import { useAvailabilityDetail } from "@/hooks/use-availability-detail";
import { useTutorAvailability } from "@/hooks/use-tutor-availability";
import { useTutorBookings } from "@/hooks/use-tutor-bookings";
import { fromIsoDate, toIsoDate } from "@/lib/week";
import { AvailabilityService } from "@/services/availability.service";
import { useTutorProfile } from "@/hooks/use-tutor-profile";
import { formatDayLabel } from "@/utils/calendar";

const CALENDAR_ROUTE = "/tutor-dashboard/calendar" as Href;
const ONLINE_OPTION: SelectOption = { id: "online", label: "En ligne" };

/** Même choix que dans l'onboarding : un créneau pour une date précise, ou répété chaque semaine. */
type RepeatMode = "once" | "weekly";
const REPEAT_OPTIONS: { id: RepeatMode; label: string; hint: string }[] = [
  { id: "once", label: "Une seule fois", hint: "Pour une date précise" },
  { id: "weekly", label: "Chaque semaine", hint: "Se répète les jours choisis" },
];
/** dow : 0 = dimanche … 6 = samedi (convention de l'API). */
const WEEKDAYS = [
  { dow: 1, label: "Lundi" },
  { dow: 2, label: "Mardi" },
  { dow: 3, label: "Mercredi" },
  { dow: 4, label: "Jeudi" },
  { dow: 5, label: "Vendredi" },
  { dow: 6, label: "Samedi" },
  { dow: 0, label: "Dimanche" },
];

type WeeklyDraftDay = {
  dow: number;
  dayLabel: string;
  active: boolean;
  slots: { id: string; startTime: string; endTime: string }[];
};

type ConfiguredSlot = {
  id: string;
  startTime: string;
  endTime: string;
};

export function AvailabilityEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, date: dateParam } = useLocalSearchParams<{ id?: string; date?: string }>();
  const isEditMode = !!id;

  const { state: detailState } = useAvailabilityDetail(id);
  const { state: profileState } = useTutorProfile();
  const { state: actionState, save, saveAll, remove } = useAvailabilityActions();

  // Date selection state
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  // Date préremplie depuis le calendrier (?date=AAAA-MM-JJ), à venir uniquement.
  const initialDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam >= todayIso ? dateParam : todayIso;
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>(formatDayLabel(initialDate));

  // Une seule fois (date) ou chaque semaine (jours de la semaine) — comme dans l'onboarding.
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("once");
  const [weekdays, setWeekdays] = useState<number[]>(() => [fromIsoDate(initialDate).getDay()]);

  // « Chaque semaine » (création) : mêmes cartes de jours et même fenêtre d'ajout que dans l'onboarding du tuteur.
  const initialDow = fromIsoDate(initialDate).getDay();
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDraftDay[]>(() =>
    WEEKDAYS.map((day) => ({ dow: day.dow, dayLabel: day.label, active: day.dow === initialDow, slots: [] })),
  );
  const [slotTarget, setSlotTarget] = useState<{ dow: number; label: string } | null>(null);

  // Pastilles du calendrier : ce qui est déjà planifié (créneaux + rendez-vous).
  const { state: calendarAvailability } = useTutorAvailability();
  const { state: calendarBookings } = useTutorBookings();
  const calendarMarkers = useMemo(
    () =>
      markersFromOccurrences(
        AvailabilityService.expandCalendar(
          calendarAvailability.status === "success" ? calendarAvailability.availability : [],
          calendarBookings.status === "success" ? calendarBookings.bookings : [],
          180,
        ),
      ),
    [calendarAvailability, calendarBookings],
  );

  // Time wheel state (Start and End side by side)
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");

  // Configured slots for this date (added via the top-right + button)
  const [configuredSlots, setConfiguredSlots] = useState<ConfiguredSlot[]>([]);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Place: "En ligne" or one of the tutor's own registered locations
  // (real Place ids — no location/format checkboxes, the format is derived
  // server-side from the place chosen, AGENTS.md §11).
  const [placeOption, setPlaceOption] = useState<SelectOption | null>(null);

  // Locations registered by the tutor
  const locations = profileState.status === "success" ? profileState.profile.locations : [];
  const placeOptions: SelectOption[] = [ONLINE_OPTION, ...locations.map((l) => ({ id: l.id, label: l.label }))];

  // Seed form in edit mode
  useEffect(() => {
    if (detailState.status !== "success") return;
    const entry = detailState.entry;
    setRepeatMode(entry.kind === "recurring" ? "weekly" : "once");
    setWeekdays([entry.dayOfWeek]);
    setSelectedDate(entry.date ?? todayIso);
    setSelectedDateLabel(entry.dateLabel);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setConfiguredSlots([
      {
        id: entry.id,
        startTime: entry.startTime,
        endTime: entry.endTime,
      },
    ]);
    setPlaceOption(entry.placeId ? { id: entry.placeId, label: entry.locationLabel } : ONLINE_OPTION);
  }, [detailState, todayIso]);

  const placeId = placeOption && placeOption.id !== "online" ? placeOption.id : null;

  // Add slot handler (+ button in top right of time section)
  const handleAddSlot = () => {
    setSlotError(null);
    if (!startTime || !endTime) {
      setSlotError("Veuillez sélectionner une heure de début et de fin.");
      return;
    }
    if (startTime >= endTime) {
      setSlotError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }

    const duplicate = configuredSlots.some(
      (s) => s.startTime === startTime && s.endTime === endTime
    );
    if (duplicate) {
      setSlotError("Ce créneau horaire a déjà été ajouté.");
      return;
    }

    const newSlot: ConfiguredSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startTime,
      endTime,
    };
    setConfiguredSlots((prev) => [...prev, newSlot]);

    // Advance wheel to next hour for convenience
    const [endH] = endTime.split(":");
    const nextStartH = Math.min(22, Number(endH));
    const nextEndH = Math.min(23, nextStartH + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    setStartTime(`${pad(nextStartH)}:00`);
    setEndTime(`${pad(nextEndH)}:00`);
  };

  const handleRemoveSlot = (slotId: string) => {
    setConfiguredSlots((prev) => prev.filter((s) => s.id !== slotId));
    setSlotError(null);
  };

  // Determine if valid to submit
  const hasValidTime =
    configuredSlots.length > 0 || (!!startTime && !!endTime && startTime < endTime);

  const isWeekly = repeatMode === "weekly";
  // Création « chaque semaine » : cartes de jours + fenêtre d'ajout (comme l'onboarding) ; sinon roue + liste de ce jour.
  const useCards = isWeekly && !isEditMode;
  const weeklySlotCount = weeklyDays.filter((d) => d.active).reduce((sum, d) => sum + d.slots.length, 0);
  const canSubmit = useCards
    ? weeklySlotCount > 0 && !!placeOption
    : (isWeekly ? weekdays.length > 0 : !!selectedDate) && hasValidTime && !!placeOption;

  const toggleWeeklyDay = (dow: number) =>
    setWeeklyDays((days) => days.map((day) => (day.dow === dow ? { ...day, active: !day.active } : day)));
  const addWeeklySlot = (dow: number, startTime: string, endTime: string) =>
    setWeeklyDays((days) =>
      days.map((day) =>
        day.dow === dow
          ? { ...day, active: true, slots: [...day.slots, { id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, startTime, endTime }] }
          : day,
      ),
    );
  const removeWeeklySlot = (dow: number, slotId: string) =>
    setWeeklyDays((days) => days.map((day) => (day.dow === dow ? { ...day, slots: day.slots.filter((slot) => slot.id !== slotId) } : day)));

  const toggleWeekday = (dow: number) => {
    setWeekdays((current) => {
      // Modification d'un créneau existant : un seul jour. Création : plusieurs jours possibles.
      if (isEditMode) return [dow];
      return current.includes(dow) ? current.filter((d) => d !== dow) : [...current, dow];
    });
  };
  const weekdaysLabel = WEEKDAYS.filter((d) => weekdays.includes(d.dow))
    .map((d) => d.label.toLowerCase())
    .join(", ");

  const isSaving = actionState.status === "saving";
  const isDeleting = actionState.status === "deleting";

  const handleSave = async () => {
    if (!canSubmit || !selectedDate) return;

    // Slots to save: either the configured slots list or the active wheel slot
    const slotsToSave: { startTime: string; endTime: string }[] =
      configuredSlots.length > 0
        ? configuredSlots
        : [{ startTime, endTime }];

    if (isEditMode && id) {
      // In edit mode, update the single existing entry (son type — ponctuel / hebdomadaire — ne change pas)
      const firstSlot = slotsToSave[0];
      const entry = await save(
        id,
        isWeekly
          ? { kind: "recurring", dayOfWeek: weekdays[0], startTime: firstSlot.startTime, endTime: firstSlot.endTime, placeId }
          : { kind: "one_off", date: selectedDate, startTime: firstSlot.startTime, endTime: firstSlot.endTime, placeId },
      );
      if (entry) router.replace(CALENDAR_ROUTE);
    } else {
      // Création : chaque plage horaire × (la date choisie | chaque jour de la semaine coché)
      const drafts = useCards
        ? weeklyDays
            .filter((day) => day.active)
            .flatMap((day) =>
              day.slots.map((slot) => ({
                kind: "recurring" as const,
                dayOfWeek: day.dow,
                startTime: slot.startTime,
                endTime: slot.endTime,
                placeId,
              })),
            )
        : isWeekly
        ? weekdays.flatMap((dayOfWeek) =>
            slotsToSave.map((s) => ({
              kind: "recurring" as const,
              dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              placeId,
            })),
          )
        : slotsToSave.map((s) => ({
            kind: "one_off" as const,
            date: selectedDate,
            startTime: s.startTime,
            endTime: s.endTime,
            placeId,
          }));

      const ok = await saveAll(drafts);
      if (ok) router.replace(CALENDAR_ROUTE);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;
    const ok = await remove(id);
    if (ok) router.replace(CALENDAR_ROUTE);
  };

  const isLoadingDetail =
    (isEditMode && detailState.status === "loading") || profileState.status === "loading";
  const detailError =
    isEditMode && detailState.status === "error" ? detailState.message : null;

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />

      {isLoadingDetail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#332E86" />
        </View>
      ) : detailError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[14px] text-error">{detailError}</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom + 90, 110),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Header */}
          <FadeIn delay={20}>
            <View className="mb-5 pt-1">
              <Text className="text-[25px] font-bold text-ink">
                {isEditMode ? "Modifier la disponibilité" : "Ajouter des disponibilités"}
              </Text>
              <Text className="mt-1 text-[13.5px] text-ink-soft">
                Définissez les dates, plages horaires et lieux où vous pouvez enseigner
              </Text>
            </View>
          </FadeIn>

          {actionState.status === "error" ? (
            <View className="mb-4">
              <FormError message={actionState.message} />
            </View>
          ) : null}

          {/* 1. Répétition : une seule fois OU chaque semaine (même choix que dans l'onboarding) */}
          <FadeIn delay={30}>
            <View className="mb-5">
              <Text className="mb-2 text-[14.5px] font-bold text-ink">1. Répétition</Text>
              <View className="flex-row gap-2 rounded-xl bg-paper-alt p-1" accessibilityRole="tablist">
                {REPEAT_OPTIONS.map((option) => {
                  const active = repeatMode === option.id;
                  return (
                    <PressableScale
                      key={option.id}
                      // Modifier un créneau existant ne change pas son type : supprimez-le puis recréez-le.
                      disabled={isEditMode && !active}
                      onPress={() => setRepeatMode(option.id)}
                      accessibilityLabel={option.label}
                      accessibilityState={{ selected: active, disabled: isEditMode && !active }}
                      style={{ flex: 1 }}
                    >
                      <View className={["items-center rounded-lg px-2 py-2.5", active ? "bg-surface" : "", isEditMode && !active ? "opacity-40" : ""].join(" ")}>
                        <Text className={["text-[13.5px] font-bold", active ? "text-primary" : "text-ink-soft"].join(" ")}>{option.label}</Text>
                        <Text className="mt-0.5 text-[11px] text-ink-faint">{option.hint}</Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
              <Text className="mt-2 text-[12px] text-ink-soft">
                {isWeekly
                  ? "Ce créneau est proposé chaque semaine, les jours choisis, jusqu'à ce que vous le supprimiez."
                  : "Ce créneau n'est proposé que ce jour-là, une seule fois."}
              </Text>
            </View>
          </FadeIn>

          {useCards ? (
            <FadeIn delay={40}>
              <View>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-[14.5px] font-bold text-ink">2. Jours et horaires</Text>
                  <Text className="text-[12.5px] font-medium text-primary">
                    {weeklySlotCount} créneau{weeklySlotCount > 1 ? "x" : ""}
                  </Text>
                </View>
                <View className="gap-3">
                  {weeklyDays.map((day) => (
                    <RecurringDayCard
                      key={day.dow}
                      day={day}
                      onToggle={() => toggleWeeklyDay(day.dow)}
                      onAdd={() => setSlotTarget({ dow: day.dow, label: `${day.dayLabel}, chaque semaine` })}
                      onRemove={(slotId) => removeWeeklySlot(day.dow, slotId)}
                    />
                  ))}
                </View>
              </View>
            </FadeIn>
          ) : (
            <>
          {/* Side-by-side or stacked layout matching user's design image */}
          <View className="flex-col lg:flex-row gap-5">
            {/* Left Section: date (une seule fois) ou jours de la semaine (chaque semaine) */}
            <View className="min-w-[300px] lg:flex-1">
              <FadeIn delay={40}>
                {isWeekly ? (
                  <View>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-[14.5px] font-bold text-ink">2. Jours de la semaine</Text>
                      <Text className="text-[12.5px] font-medium text-primary">{weekdays.length} jour{weekdays.length > 1 ? "s" : ""}</Text>
                    </View>
                    <View className="rounded-[28px] border border-line bg-surface p-4">
                      <View className="flex-row flex-wrap gap-2">
                        {WEEKDAYS.map((day) => {
                          const active = weekdays.includes(day.dow);
                          return (
                            <PressableScale
                              key={day.dow}
                              onPress={() => toggleWeekday(day.dow)}
                              accessibilityLabel={`Chaque ${day.label.toLowerCase()}`}
                              accessibilityState={{ selected: active }}
                            >
                              <View className={["rounded-full border px-4 py-2.5", active ? "border-primary bg-primary" : "border-line bg-paper"].join(" ")}>
                                <Text className={["text-[13.5px] font-bold", active ? "text-white" : "text-ink-soft"].join(" ")}>{day.label}</Text>
                              </View>
                            </PressableScale>
                          );
                        })}
                      </View>
                      <Text className="mt-3 text-[12px] text-ink-faint">
                        {isEditMode ? "Choisissez le jour de ce créneau hebdomadaire." : "Vous pouvez cocher plusieurs jours : le même créneau est créé pour chacun."}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-[14.5px] font-bold text-ink">2. Date</Text>
                      <Text className="text-[12.5px] font-medium text-primary">{selectedDateLabel}</Text>
                    </View>
                    <HabitCalendar
                      variant="card"
                      selectedDate={selectedDate}
                      onSelectDate={(date) => {
                        setSelectedDate(date);
                        setSelectedDateLabel(formatDayLabel(date));
                      }}
                      markers={calendarMarkers}
                      minDate={todayIso}
                    />
                  </View>
                )}
              </FadeIn>
            </View>

            {/* Right Section: Time Wheels + Plus Button + Configured Slots */}
            <View className="min-w-[300px] lg:flex-1">
              <FadeIn delay={60}>
                {/* Header with Title and Plus Button in the top right */}
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[14.5px] font-bold text-ink">
                      3. Plage horaire (roue)
                    </Text>
                    <ClockIcon size={14} color="#9799AF" />
                  </View>

                  {/* Plus button at the top right */}
                  <PressableScale
                    onPress={handleAddSlot}
                    accessibilityLabel="Ajouter ce créneau horaire"
                  >
                    <View className="flex-row items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 shadow-2xs">
                      <PlusIcon size={14} color="#ffffff" />
                      <Text className="text-[12.5px] font-bold text-white">Ajouter</Text>
                    </View>
                  </PressableScale>
                </View>

                {/* Time Wheel Picker: Start Time & End Time side by side */}
                <TimeRangeWheelPicker
                  startTime={startTime}
                  endTime={endTime}
                  onChangeStart={(t) => {
                    setStartTime(t);
                    setSlotError(null);
                  }}
                  onChangeEnd={(t) => {
                    setEndTime(t);
                    setSlotError(null);
                  }}
                />

                {/* Error message for invalid time */}
                {slotError || (startTime && endTime && startTime >= endTime) ? (
                  <Text className="mt-2 text-[12.5px] font-medium text-error">
                    {slotError ?? "L'heure de fin doit être après l'heure de début."}
                  </Text>
                ) : null}

                {/* List of configured slots for this day (matching the image slots column) */}
                {configuredSlots.length > 0 ? (
                  <View className="mt-4 rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
                    <Text className="mb-2.5 text-[12px] font-bold text-ink-soft uppercase tracking-wider">
                      Créneaux programmés {isWeekly ? `chaque ${weekdaysLabel || "semaine"}` : `pour le ${selectedDateLabel}`} ({configuredSlots.length})
                    </Text>
                    <View className="gap-2">
                      {configuredSlots.map((slot) => (
                        <View
                          key={slot.id}
                          className="flex-row items-center justify-between rounded-lg border border-line-soft bg-paper px-3 py-2.5"
                        >
                          <View className="flex-row items-center gap-2">
                            <View className="h-6 w-6 items-center justify-center rounded-md bg-primary-tint">
                              <ClockIcon size={12} color="#332E86" />
                            </View>
                            <Text className="text-[14px] font-bold text-ink tabular-nums">
                              {slot.startTime} → {slot.endTime}
                            </Text>
                          </View>

                          <PressableScale
                            onPress={() => handleRemoveSlot(slot.id)}
                            accessibilityLabel={`Supprimer le créneau ${slot.startTime} à ${slot.endTime}`}
                          >
                            <View className="h-7 w-7 items-center justify-center rounded-md">
                              <XIcon size={14} color="#DE3B40" />
                            </View>
                          </PressableScale>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </FadeIn>
            </View>
          </View>

            </>
          )}

          {/* Place Section (replaces format checkboxes — the format is derived
              server-side from the place chosen, one_off draft only takes a
              placeId, not a format) */}
          <FadeIn delay={80}>
            <View className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-2xs">
              <Text className="mb-3 text-[14.5px] font-bold text-ink">{useCards ? "3" : "4"}. Lieu du cours</Text>

              <SelectField
                label="Où donnez-vous ce cours ?"
                value={placeOption}
                options={placeOptions}
                placeholder="Sélectionnez un lieu"
                onSelect={setPlaceOption}
              />
              {locations.length === 0 ? (
                <Text className="mt-1 text-[12px] text-ink-faint">
                  Ajoutez des lieux d&apos;intervention dans vos paramètres pour les proposer ici en plus du lieu « En ligne ».
                </Text>
              ) : null}
            </View>
          </FadeIn>
        </ScrollView>
      )}

      {/* Fenêtre d'ajout d'un créneau hebdomadaire — la même que dans l'onboarding (sans format : il découle du lieu) */}
      {slotTarget ? (
        <SlotModal
          showFormat={false}
          subtitle={slotTarget.label}
          onClose={() => setSlotTarget(null)}
          onSave={(slot) => {
            addWeeklySlot(slotTarget.dow, slot.startTime, slot.endTime);
            setSlotTarget(null);
          }}
        />
      ) : null}

      {/* Sticky Bottom Summary Bar matching image.png */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-line bg-surface/95 px-5 py-3.5 backdrop-blur-md shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto w-full">
          {/* Summary text */}
          <View className="flex-1">
            <Text className="text-[13px] text-ink-soft" numberOfLines={2}>
              {isWeekly ? "Disponibilité chaque " : "Disponibilité pour le "}
              <Text className="font-bold text-ink">
                {useCards
                  ? weeklyDays.filter((d) => d.active).map((d) => d.dayLabel.toLowerCase()).join(", ") || "—"
                  : isWeekly
                  ? weekdaysLabel || "—"
                  : selectedDateLabel}
              </Text>
              {" • "}
              <Text className="font-semibold text-primary">
                {useCards
                  ? `${weeklySlotCount} créneau${weeklySlotCount > 1 ? "x" : ""}`
                  : configuredSlots.length > 0
                  ? `${configuredSlots.length} créneau(x)`
                  : `${startTime} à ${endTime}`}
              </Text>
              {" • "}
              <Text className="font-medium text-ink-faint">{placeOption?.label ?? "Lieu non choisi"}</Text>
            </Text>
          </View>

          {/* Action buttons */}
          <View className="flex-row items-center gap-2.5 w-full sm:w-auto">
            {isEditMode ? (
              <Button
                label="Supprimer"
                variant="ghost"
                disabled={isSaving || isDeleting}
                loading={isDeleting}
                loadingLabel="Suppression..."
                onPress={handleDelete}
              />
            ) : null}

            <Button
              label={
                isEditMode
                  ? "Enregistrer les modifications"
                  : useCards && weeklySlotCount > 1
                  ? `Enregistrer (${weeklySlotCount} créneaux)`
                  : configuredSlots.length > 1
                  ? `Enregistrer (${configuredSlots.length} créneaux)`
                  : "Enregistrer la disponibilité"
              }
              disabled={!canSubmit || isSaving || isDeleting}
              loading={isSaving}
              loadingLabel="Enregistrement..."
              onPress={handleSave}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

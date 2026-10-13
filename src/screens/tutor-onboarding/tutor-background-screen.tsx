import { type Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BriefcaseIcon,
  CheckIcon,
  GraduationCapIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@/components/icons";
import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { StepProgress } from "@/components/ui/step-progress";
import { TextField } from "@/components/ui/text-field";
import {
  type EducationDegree,
  type TutorExperienceEntry,
  type TutorExperienceType,
  useTutorApplicationStore,
} from "@/store/tutor-application.store";

const TUTOR_SKILLS_ROUTE = "/tutor-skills" as Href;
const TOTAL_STEPS = 9;

const DEGREE_OPTIONS: EducationDegree[] = [
  { id: "bac", label: "Baccalauréat" },
  { id: "licence", label: "Licence" },
  { id: "master", label: "Master" },
  { id: "doctorat", label: "Doctorat" },
  { id: "other", label: "Autre" },
];

export function TutorBackgroundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const background = useTutorApplicationStore((s) => s.background);
  const setBackground = useTutorApplicationStore((s) => s.setBackground);
  const addExperience = useTutorApplicationStore((s) => s.addExperience);
  const updateExperience = useTutorApplicationStore((s) => s.updateExperience);
  const removeExperience = useTutorApplicationStore((s) => s.removeExperience);

  const experiences = useMemo(() => background.experiences ?? [], [background.experiences]);

  const proExperiences = useMemo(
    () => experiences.filter((e) => e.type === "professionnelle"),
    [experiences]
  );
  const academicExperiences = useMemo(
    () => experiences.filter((e) => e.type === "academique"),
    [experiences]
  );

  // Form State (Modal)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<TutorExperienceType>("professionnelle");
  const [formTitle, setFormTitle] = useState("");
  const [formOrganization, setFormOrganization] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const handleStartAdd = (defaultType: TutorExperienceType = "professionnelle") => {
    setEditingId(null);
    setFormType(defaultType);
    setFormTitle("");
    setFormOrganization("");
    setFormPeriod("");
    setFormDescription("");
    setFormError("");
    setSuccessToast("");
    setIsFormOpen(true);
  };

  const handleStartEdit = (exp: TutorExperienceEntry) => {
    setEditingId(exp.id);
    setFormType(exp.type);
    setFormTitle(exp.title);
    setFormOrganization(exp.organization);
    setFormPeriod(exp.period);
    setFormDescription(exp.description ?? "");
    setFormError("");
    setSuccessToast("");
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormError("");
    setSuccessToast("");
  };

  const handleSaveExperience = (addAnother = false) => {
    if (!formTitle.trim()) {
      setFormError("Veuillez renseigner l'intitulé de l'expérience.");
      return;
    }
    if (!formOrganization.trim()) {
      setFormError(
        formType === "professionnelle"
          ? "Veuillez renseigner l'entreprise ou la structure."
          : "Veuillez renseigner l'établissement ou l'université."
      );
      return;
    }
    if (!formPeriod.trim()) {
      setFormError("Veuillez renseigner la période ou la durée.");
      return;
    }

    if (editingId) {
      updateExperience(editingId, {
        type: formType,
        title: formTitle.trim(),
        organization: formOrganization.trim(),
        period: formPeriod.trim(),
        description: formDescription.trim() || undefined,
      });
      setIsFormOpen(false);
      setEditingId(null);
    } else {
      addExperience({
        type: formType,
        title: formTitle.trim(),
        organization: formOrganization.trim(),
        period: formPeriod.trim(),
        description: formDescription.trim() || undefined,
      });

      if (addAnother) {
        setSuccessToast(`Expérience "${formTitle.trim()}" ajoutée !`);
        setFormTitle("");
        setFormOrganization("");
        setFormPeriod("");
        setFormDescription("");
        setFormError("");
        return;
      }

      setIsFormOpen(false);
    }

    setEditingId(null);
    setFormTitle("");
    setFormOrganization("");
    setFormPeriod("");
    setFormDescription("");
    setFormError("");
    setSuccessToast("");
  };

  const canContinue =
    !!background.degree &&
    background.field.trim().length > 0 &&
    background.institution.trim().length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={2} total={TOTAL_STEPS} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Quel est votre parcours&nbsp;?</Text>
          <Text className="mb-6 text-[13.5px] text-ink-soft">
            Renseignez votre formation académique et vos différentes expériences professionnelles et universitaires.
          </Text>
        </FadeIn>

        {/* Section 1: Formation initiale */}
        <FadeIn delay={80}>
          <View className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <Text className="mb-3 text-[14px] font-bold uppercase tracking-wide text-primary">
              1. Formation initiale
            </Text>

            <SelectField
              label="Niveau d'études"
              value={background.degree}
              options={DEGREE_OPTIONS}
              onSelect={(option) => {
                const degree = DEGREE_OPTIONS.find((d) => d.id === option.id) ?? null;
                setBackground({ degree });
              }}
            />
            <TextField
              label="Domaine"
              value={background.field}
              onChangeText={(field) => setBackground({ field })}
              placeholder="Ex : Informatique, Mathématiques, Lettres..."
            />
            <TextField
              label="Établissement"
              value={background.institution}
              onChangeText={(institution) => setBackground({ institution })}
              placeholder="Ex : Université de Paris, École Centrale..."
            />
          </View>
        </FadeIn>

        {/* Global Experiences Summary Counter */}
        <FadeIn delay={110}>
          <View className="mb-6 flex-row items-center justify-between rounded-xl bg-primary-tint/30 px-3.5 py-2.5 border border-primary/15">
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-tint">
                <BriefcaseIcon size={14} color="#332E86" />
              </View>
              <Text className="text-[13px] font-bold text-ink">
                Expériences enregistrées :{" "}
                <Text className="text-primary font-extrabold">{experiences.length}</Text>
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="rounded-full bg-white px-2.5 py-0.5 border border-line">
                <Text className="text-[11.5px] font-bold text-primary">
                  {proExperiences.length} pro
                </Text>
              </View>
              <View className="rounded-full bg-white px-2.5 py-0.5 border border-line">
                <Text className="text-[11.5px] font-bold text-[#6D5BD0]">
                  {academicExperiences.length} acad.
                </Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Section 2: Expériences Professionnelles */}
        <FadeIn delay={130}>
          <View className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-tint">
                  <BriefcaseIcon size={14} color="#332E86" />
                </View>
                <View>
                  <Text className="text-[15px] font-bold text-ink">
                    2. Expériences professionnelles
                  </Text>
                  <Text className="text-[12px] text-ink-soft">
                    Cours dispensés, stages, postes en entreprise, freelance...
                  </Text>
                </View>
              </View>
              <View className="rounded-full bg-primary-tint px-2.5 py-0.5 border border-primary/20">
                <Text className="text-[11.5px] font-bold text-primary">
                  {proExperiences.length}
                </Text>
              </View>
            </View>

            {/* List of Professional Experiences */}
            {proExperiences.length > 0 ? (
              <View className="gap-2.5 mb-3">
                {proExperiences.map((exp) => (
                  <View
                    key={exp.id}
                    className="rounded-xl border border-line bg-paper p-3.5 shadow-2xs"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-[14.5px] font-bold text-ink">{exp.title}</Text>
                        <Text className="text-[12.5px] font-medium text-ink-soft mt-0.5">
                          {exp.organization} •{" "}
                          <Text className="text-primary font-bold">{exp.period}</Text>
                        </Text>
                        {exp.description ? (
                          <Text className="mt-1.5 text-[12px] text-ink-soft leading-[17px]">
                            {exp.description}
                          </Text>
                        ) : null}
                      </View>

                      {/* Edit & Delete actions */}
                      <View className="flex-row items-center gap-1.5">
                        <PressableScale
                          onPress={() => handleStartEdit(exp)}
                          accessibilityLabel={`Modifier ${exp.title}`}
                          className="h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface hover:bg-paper active:scale-95"
                        >
                          <PencilIcon size={13} color="#332E86" />
                        </PressableScale>
                        <PressableScale
                          onPress={() => removeExperience(exp.id)}
                          accessibilityLabel={`Supprimer ${exp.title}`}
                          className="h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface hover:bg-error-tint/40 active:scale-95"
                        >
                          <TrashIcon size={13} color="#AC4A40" />
                        </PressableScale>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="mb-3 rounded-xl border border-dashed border-line p-3.5 text-center items-center justify-center bg-paper/50">
                <Text className="text-[12.5px] text-ink-soft text-center">
                  Aucune expérience professionnelle ajoutée pour le moment.
                </Text>
              </View>
            )}

            {/* Add Button for Pro Experience */}
            <PressableScale
              onPress={() => handleStartAdd("professionnelle")}
              accessibilityLabel="Ajouter une expérience professionnelle"
              className="flex-row items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary-tint/30 py-3 px-3 active:scale-98 hover:bg-primary-tint/50 transition-all"
            >
              <PlusIcon size={15} color="#332E86" />
              <Text className="text-[13px] font-bold text-primary">
                + Ajouter une expérience professionnelle
              </Text>
            </PressableScale>
          </View>
        </FadeIn>

        {/* Section 3: Expériences Académiques */}
        <FadeIn delay={150}>
          <View className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#f3f0fc]">
                  <GraduationCapIcon size={14} color="#6D5BD0" />
                </View>
                <View>
                  <Text className="text-[15px] font-bold text-ink">
                    3. Expériences académiques
                  </Text>
                  <Text className="text-[12px] text-ink-soft">
                    Projets de recherche, monitorat, concours, publications, distinctions...
                  </Text>
                </View>
              </View>
              <View className="rounded-full bg-[#f3f0fc] px-2.5 py-0.5 border border-[#6D5BD0]/20">
                <Text className="text-[11.5px] font-bold text-[#6D5BD0]">
                  {academicExperiences.length}
                </Text>
              </View>
            </View>

            {/* List of Academic Experiences */}
            {academicExperiences.length > 0 ? (
              <View className="gap-2.5 mb-3">
                {academicExperiences.map((exp) => (
                  <View
                    key={exp.id}
                    className="rounded-xl border border-line bg-paper p-3.5 shadow-2xs"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-[14.5px] font-bold text-ink">{exp.title}</Text>
                        <Text className="text-[12.5px] font-medium text-ink-soft mt-0.5">
                          {exp.organization} •{" "}
                          <Text className="text-[#6D5BD0] font-bold">{exp.period}</Text>
                        </Text>
                        {exp.description ? (
                          <Text className="mt-1.5 text-[12px] text-ink-soft leading-[17px]">
                            {exp.description}
                          </Text>
                        ) : null}
                      </View>

                      {/* Edit & Delete actions */}
                      <View className="flex-row items-center gap-1.5">
                        <PressableScale
                          onPress={() => handleStartEdit(exp)}
                          accessibilityLabel={`Modifier ${exp.title}`}
                          className="h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface hover:bg-paper active:scale-95"
                        >
                          <PencilIcon size={13} color="#6D5BD0" />
                        </PressableScale>
                        <PressableScale
                          onPress={() => removeExperience(exp.id)}
                          accessibilityLabel={`Supprimer ${exp.title}`}
                          className="h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface hover:bg-error-tint/40 active:scale-95"
                        >
                          <TrashIcon size={13} color="#AC4A40" />
                        </PressableScale>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="mb-3 rounded-xl border border-dashed border-line p-3.5 text-center items-center justify-center bg-paper/50">
                <Text className="text-[12.5px] text-ink-soft text-center">
                  Aucune expérience académique ajoutée pour le moment.
                </Text>
              </View>
            )}

            {/* Add Button for Academic Experience */}
            <PressableScale
              onPress={() => handleStartAdd("academique")}
              accessibilityLabel="Ajouter une expérience académique"
              className="flex-row items-center justify-center gap-2 rounded-xl border border-[#6D5BD0]/30 bg-[#f3f0fc]/60 py-3 px-3 active:scale-98 hover:bg-[#f3f0fc] transition-all"
            >
              <PlusIcon size={15} color="#6D5BD0" />
              <Text className="text-[13px] font-bold text-[#6D5BD0]">
                + Ajouter une expérience académique
              </Text>
            </PressableScale>
          </View>
        </FadeIn>
      </ScrollView>

      {/* Footer Continue Button */}
      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label="Continuer"
          disabled={!canContinue}
          onPress={() => router.push(TUTOR_SKILLS_ROUTE)}
        />
      </View>

      {/* MODALE D'AJOUT ET MODIFICATION D'EXPÉRIENCE */}
      <Modal
        visible={isFormOpen}
        transparent
        animationType="slide"
        onRequestClose={handleCancelForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/55"
        >
          <View
            className="max-h-[92%] rounded-t-[28px] border-t border-line bg-surface p-5 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 22) }}
          >
            {/* Modal Header */}
            <View className="mb-4 flex-row items-center justify-between border-b border-line-soft pb-3">
              <View className="flex-row items-center gap-2.5">
                <View
                  className={[
                    "h-9 w-9 items-center justify-center rounded-xl",
                    formType === "professionnelle" ? "bg-primary-tint" : "bg-[#f3f0fc]",
                  ].join(" ")}
                >
                  {formType === "professionnelle" ? (
                    <BriefcaseIcon size={17} color="#332E86" />
                  ) : (
                    <GraduationCapIcon size={17} color="#6D5BD0" />
                  )}
                </View>
                <View>
                  <Text className="text-[17px] font-bold text-ink">
                    {editingId ? "Modifier l'expérience" : "Ajouter une expérience"}
                  </Text>
                  <Text className="text-[12px] text-ink-soft">
                    {editingId
                      ? "Mettez à jour les informations enregistrées."
                      : "Complétez les détails de votre expérience."}
                  </Text>
                </View>
              </View>

              <PressableScale
                onPress={handleCancelForm}
                accessibilityLabel="Fermer la modale"
                className="h-8 w-8 items-center justify-center rounded-full bg-paper border border-line active:scale-95"
              >
                <XIcon size={15} color="#585B78" />
              </PressableScale>
            </View>

            {/* Modal Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              className="pr-0.5"
            >
              {/* Toast message if chaining */}
              {successToast ? (
                <View className="mb-3.5 flex-row items-center gap-2 rounded-xl bg-accent-tint/60 border border-accent/30 p-2.5">
                  <CheckIcon size={14} color="#0E9C82" />
                  <Text className="text-[12.5px] font-bold text-accent">{successToast}</Text>
                </View>
              ) : null}

              {/* Type Switcher */}
              <Text className="mb-2 text-[13px] font-semibold text-ink">
                Type d&apos;expérience <Text className="text-error">*</Text>
              </Text>
              <View className="flex-row gap-2 mb-4">
                <PressableScale
                  onPress={() => setFormType("professionnelle")}
                  className={[
                    "flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 px-3 border transition-all",
                    formType === "professionnelle"
                      ? "bg-primary border-primary"
                      : "bg-surface border-line hover:bg-paper",
                  ].join(" ")}
                >
                  <BriefcaseIcon
                    size={15}
                    color={formType === "professionnelle" ? "#ffffff" : "#585B78"}
                  />
                  <Text
                    className={[
                      "text-[13px] font-bold",
                      formType === "professionnelle" ? "text-white" : "text-ink-soft",
                    ].join(" ")}
                  >
                    Professionnelle
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => setFormType("academique")}
                  className={[
                    "flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 px-3 border transition-all",
                    formType === "academique"
                      ? "bg-[#6D5BD0] border-[#6D5BD0]"
                      : "bg-surface border-line hover:bg-paper",
                  ].join(" ")}
                >
                  <GraduationCapIcon
                    size={15}
                    color={formType === "academique" ? "#ffffff" : "#585B78"}
                  />
                  <Text
                    className={[
                      "text-[13px] font-bold",
                      formType === "academique" ? "text-white" : "text-ink-soft",
                    ].join(" ")}
                  >
                    Académique
                  </Text>
                </PressableScale>
              </View>

              {/* Form Fields */}
              <TextField
                label={
                  formType === "professionnelle"
                    ? "Intitulé du poste / Rôle *"
                    : "Intitulé du projet / Rôle / Formation *"
                }
                value={formTitle}
                onChangeText={(val) => {
                  setFormTitle(val);
                  if (formError) setFormError("");
                }}
                placeholder={
                  formType === "professionnelle"
                    ? "Ex : Enseignant particulier, Développeur..."
                    : "Ex : Projet de recherche en IA, Monitorat..."
                }
              />

              <TextField
                label={
                  formType === "professionnelle"
                    ? "Entreprise / Établissement / Organisme *"
                    : "Université / Laboratoire / Établissement *"
                }
                value={formOrganization}
                onChangeText={(val) => {
                  setFormOrganization(val);
                  if (formError) setFormError("");
                }}
                placeholder={
                  formType === "professionnelle"
                    ? "Ex : Freelance, Acadomia, Cabinet..."
                    : "Ex : Université Paris-Saclay, CNRS..."
                }
              />

              <TextField
                label="Période ou Durée *"
                value={formPeriod}
                onChangeText={(val) => {
                  setFormPeriod(val);
                  if (formError) setFormError("");
                }}
                placeholder="Ex : 2022 — 2024, 2 ans, En cours"
              />

              {/* Description field */}
              <View className="mb-4">
                <Text className="mb-1.5 ml-0.5 text-[13px] font-semibold text-ink">
                  Missions, réalisations ou compétences (optionnel)
                </Text>
                <View className="rounded-xl border border-line bg-paper p-3 focus:border-primary">
                  <TextInput
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder="Détaillez brièvement vos responsabilités ou accomplissements..."
                    placeholderTextColor="#9799AF"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="min-h-[65px] text-[14px] text-ink outline-none"
                  />
                </View>
              </View>

              {/* Error Banner */}
              {formError ? (
                <View className="mb-4 rounded-xl bg-error-tint/60 border border-error/30 p-2.5">
                  <Text className="text-[12.5px] font-semibold text-error text-center">
                    {formError}
                  </Text>
                </View>
              ) : null}

              {/* Modal Actions */}
              <View className="gap-2.5 pt-2 mb-2">
                <View className="flex-row items-center gap-2">
                  <PressableScale
                    onPress={handleCancelForm}
                    className="flex-1 items-center justify-center rounded-xl border border-line bg-paper py-3.5 active:scale-98"
                  >
                    <Text className="text-[14px] font-bold text-ink-soft">Annuler</Text>
                  </PressableScale>

                  <PressableScale
                    onPress={() => handleSaveExperience(false)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary py-3.5 px-3 shadow-sm active:scale-98"
                  >
                    <CheckIcon size={14} color="#ffffff" />
                    <Text className="text-[14px] font-bold text-white">
                      {editingId ? "Enregistrer" : "Valider"}
                    </Text>
                  </PressableScale>
                </View>

                {/* Chaining button: Save and add another experience */}
                {!editingId && (
                  <PressableScale
                    onPress={() => handleSaveExperience(true)}
                    className="flex-row items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary-tint/50 py-3 active:scale-98"
                  >
                    <PlusIcon size={14} color="#332E86" />
                    <Text className="text-[13.5px] font-bold text-primary">
                      Valider et ajouter une autre expérience
                    </Text>
                  </PressableScale>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

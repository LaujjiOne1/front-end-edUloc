import { useRef, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

import { PlusIcon, SearchIcon, XIcon } from "@/components/icons";
import { PressableScale } from "@/components/motion/pressable-scale";
import { useSkillSuggestions } from "@/hooks/use-skill-suggestions";
import { normalizeSkillName } from "@/lib/degree-policy";
import { TutorApplicationService } from "@/services/tutor-application.service";
import type { DegreeId } from "@/types/common";
import type { TutorSkill } from "@/types/tutor-application";

type SkillComboboxProps = {
  /** Plus haut diplôme du tuteur : les suggestions sont limitées aux niveaux qu'il peut enseigner. */
  degree: DegreeId | null;
  selected: TutorSkill[];
  onSelect: (skill: TutorSkill) => void;
};

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 60;
/** Mêmes caractères que le serveur : lettres, chiffres, espace et  ' ’ . , + # & ( ) / - */
const VALID_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '’.,+#&()/-]*$/u;

/**
 * Combo box à autocomplétion avec création libre (étape « Qu'enseignez-vous ? ») :
 *  1. le tuteur tape « Alge » ;
 *  2. l'app suggère les compétences existantes (Algèbre linéaire, Algèbre abstraite…), filtrées selon son diplôme ;
 *  3. une compétence rare (« Algorithmique quantique ») n'est pas trouvée : l'app propose
 *     « Ajouter "Algorithmique quantique" comme nouvelle compétence ».
 */
export function SkillCombobox({ degree, selected, onSelect }: SkillComboboxProps) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { state, retry } = useSkillSuggestions(text, degree, open);

  const name = text.replace(/\s+/g, " ").trim();
  const key = normalizeSkillName(name);
  const selectedIds = new Set(selected.map((s) => s.id));
  const suggestions = state.status === "success" ? state.skills.filter((s) => !selectedIds.has(s.id)) : [];
  const alreadySelected = key.length > 0 && selected.some((s) => normalizeSkillName(s.label) === key);
  const exactSuggested = state.status === "success" && state.skills.some((s) => normalizeSkillName(s.label) === key);
  const nameError =
    name.length === 0
      ? null
      : name.length < MIN_NAME_LENGTH
        ? `Au moins ${MIN_NAME_LENGTH} caractères.`
        : name.length > MAX_NAME_LENGTH
          ? `${MAX_NAME_LENGTH} caractères maximum.`
          : !VALID_NAME.test(name)
            ? "Caractères non autorisés."
            : null;
  // La proposition de création n'apparaît qu'une fois la recherche terminée, pour un nom valide et inconnu.
  const canCreate = state.status === "success" && name.length >= MIN_NAME_LENGTH && !nameError && !exactSuggested && !alreadySelected;

  const choose = (skill: TutorSkill) => {
    onSelect(skill);
    setText("");
    setCreateError(null);
  };

  const create = async () => {
    if (!canCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { skill } = await TutorApplicationService.createSkill(name);
      choose(skill);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Impossible d'ajouter cette compétence.");
    } finally {
      setCreating(false);
    }
  };

  const submit = () => {
    if (suggestions.length > 0) choose(suggestions[0]);
    else void create();
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    // Laisse le temps à un appui sur une suggestion d'aboutir avant de refermer la liste.
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  return (
    <View>
      <View
        className={[
          "flex-row items-center gap-[10px] rounded-lg border bg-surface px-[14px] py-3",
          open ? "border-primary" : "border-line",
        ].join(" ")}
      >
        <SearchIcon size={17} color="#9799AF" />
        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            setCreateError(null);
          }}
          onFocus={() => {
            cancelClose();
            setOpen(true);
          }}
          onBlur={scheduleClose}
          onSubmitEditing={submit}
          placeholder="Tapez une matière ou une compétence…"
          placeholderTextColor="#9799AF"
          autoCapitalize="sentences"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={MAX_NAME_LENGTH + 20}
          className="flex-1 text-[14.5px] text-ink"
          accessibilityRole="combobox"
          accessibilityLabel="Rechercher ou ajouter une compétence"
          accessibilityState={{ expanded: open }}
        />
        {text ? (
          <PressableScale onPress={() => setText("")} accessibilityLabel="Effacer la saisie">
            <XIcon size={16} color="#9799AF" />
          </PressableScale>
        ) : null}
      </View>

      {nameError ? <Text className="mt-1.5 text-[12px] text-error">{nameError}</Text> : null}
      {createError ? <Text className="mt-1.5 text-[12.5px] text-error">{createError}</Text> : null}

      {open ? (
        <View
          className="mt-2 overflow-hidden rounded-lg border border-line bg-surface"
          accessibilityRole="list"
          onTouchStart={cancelClose}
          // @ts-expect-error — web uniquement : garde la liste ouverte pendant le clic (avant le blur du champ).
          onMouseDown={cancelClose}
        >
          {state.status === "loading" ? (
            <View className="flex-row items-center gap-2 px-4 py-3.5">
              <ActivityIndicator size="small" color="#332E86" />
              <Text className="text-[13px] text-ink-soft">Recherche…</Text>
            </View>
          ) : null}

          {state.status === "error" ? (
            <View className="flex-row items-center gap-3 px-4 py-3.5">
              <Text className="flex-1 text-[13px] text-error">{state.message}</Text>
              <PressableScale onPress={retry} accessibilityLabel="Réessayer la recherche">
                <Text className="text-[13px] font-semibold text-primary">Réessayer</Text>
              </PressableScale>
            </View>
          ) : null}

          {state.status === "success" && !name ? (
            <Text className="px-4 pb-1 pt-3 text-[11.5px] font-semibold uppercase text-ink-faint">
              Suggestions pour votre niveau
            </Text>
          ) : null}

          {suggestions.map((skill) => (
            <PressableScale key={skill.id} onPress={() => choose(skill)} accessibilityLabel={`Ajouter ${skill.label}`}>
              <View className="flex-row items-center gap-2 border-t border-line-soft px-4 py-3">
                <Text className="flex-1 text-[14.5px] font-semibold text-ink">{skill.label}</Text>
                {skill.isVerified ? null : (
                  <View className="rounded bg-accent-tint px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-accent">Ma compétence</Text>
                  </View>
                )}
                {skill.category ? (
                  <View className="rounded bg-paper px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-ink-soft">{skill.category}</Text>
                  </View>
                ) : null}
              </View>
            </PressableScale>
          ))}

          {state.status === "success" && suggestions.length === 0 && !canCreate && name && !nameError ? (
            <Text className="px-4 py-3.5 text-[13px] text-ink-faint">
              {alreadySelected ? "Cette compétence est déjà dans votre liste." : "Aucun résultat."}
            </Text>
          ) : null}

          {canCreate ? (
            <PressableScale
              onPress={create}
              disabled={creating}
              accessibilityLabel={`Ajouter « ${name} » comme nouvelle compétence`}
            >
              <View className="flex-row items-center gap-2.5 border-t border-line-soft bg-primary-tint/30 px-4 py-3.5">
                {creating ? <ActivityIndicator size="small" color="#332E86" /> : <PlusIcon size={16} color="#332E86" />}
                <Text className="flex-1 text-[14px] font-bold text-primary">
                  {creating ? "Ajout…" : `Ajouter « ${name} » comme nouvelle compétence`}
                </Text>
              </View>
            </PressableScale>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

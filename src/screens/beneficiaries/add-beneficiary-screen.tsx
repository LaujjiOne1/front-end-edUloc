import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion/fade-in";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { SelectField, type SelectOption } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { useCreateBeneficiary } from "@/hooks/use-create-beneficiary";
import { useLevels } from "@/hooks/use-levels";
import { RELATION_OPTIONS } from "@/screens/booking/beneficiary-screen";
import type { Relationship } from "@/types/beneficiary";

/**
 * The reference screen (34_Beneficiaries) links "Ajouter un bénéficiaire" to
 * 17_Beneficiary.html, but that screen (src/screens/booking/beneficiary-screen.tsx)
 * is a step of the booking wizard, guarded on an offer/slot already being
 * picked — reusing it here would bounce straight back to Home. This is the
 * minimal standalone equivalent needed for this screen's own button to work
 * (AGENTS.md §2): same fields, saved directly to the address book instead of
 * the booking wizard's draft.
 */
export function AddBeneficiaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state: levelsState } = useLevels();
  const { state: createState, submit } = useCreateBeneficiary();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState<SelectOption | null>(null);
  const [level, setLevel] = useState<SelectOption | null>(null);

  const isSubmitting = createState.status === "loading";

  const levelOptions: SelectOption[] =
    levelsState.status === "success" ? levelsState.levels.map((l) => ({ id: l.id, label: l.label })) : [];

  const canSubmit =
    firstName.trim().length > 0 && lastName.trim().length > 0 && !!relation && !!level && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !relation || !level) return;
    const fullLevel = levelsState.status === "success" ? levelsState.levels.find((l) => l.id === level.id) : undefined;
    if (!fullLevel) return;

    const beneficiary = await submit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      relationship: relation.id as Exclude<Relationship, "self">,
      levelId: fullLevel.id,
    });
    if (beneficiary) router.back();
  };

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <AuthHeader onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={30}>
          <Text className="mb-5 text-[24px] font-bold text-ink">Ajouter un bénéficiaire</Text>
        </FadeIn>

        <FadeIn delay={70}>
          {createState.status === "error" ? <FormError message={createState.message} /> : null}

          <TextField
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Thomas"
            editable={!isSubmitting}
          />
          <TextField
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Rakoto"
            editable={!isSubmitting}
          />
          <SelectField
            label="Relation"
            value={relation}
            options={RELATION_OPTIONS}
            onSelect={setRelation}
            disabled={isSubmitting}
          />
          <SelectField
            label="Niveau"
            value={level}
            options={levelOptions}
            placeholder={levelsState.status === "loading" ? "Chargement..." : "Sélectionner"}
            disabled={levelsState.status !== "success" || isSubmitting}
            onSelect={setLevel}
          />
          {levelsState.status === "error" ? (
            <Text className="text-[13px] text-error">{levelsState.message}</Text>
          ) : null}
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button
          label="Ajouter"
          loading={isSubmitting}
          loadingLabel="Ajout..."
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

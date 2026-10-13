import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
// The birth-date field expands into a draggable wheel picker (vertical pan)
// right inside this scroll view — react-native-gesture-handler's ScrollView
// is needed here so its own vertical scroll gesture correctly yields to the
// wheel's GestureDetector instead of swallowing the drag (plain RN
// ScrollView doesn't participate in RNGH's gesture arbitration).
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion/fade-in";
import { TutorAvatar } from "@/components/ui/tutor-avatar";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { BirthDateField } from "@/components/ui/birth-date-field";
import { Button } from "@/components/ui/button";
import { PhoneInputField } from "@/components/ui/phone-input-field";
import { StepProgress } from "@/components/ui/step-progress";
import { TextField } from "@/components/ui/text-field";
import { useAuthStore } from "@/store/auth.store";
import { useTutorApplicationStore } from "@/store/tutor-application.store";

const TUTOR_BACKGROUND_ROUTE = "/tutor-background" as Href;
const TOTAL_STEPS = 9;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,}$/;
const BIRTH_DATE_REGEX = /^(\d{2})[/ ]+(\d{2})[/ ]+(\d{4})$/;

type Field = "firstName" | "lastName" | "gender" | "birthDate" | "phone" | "email";
type FieldErrors = Partial<Record<Field, string>>;

export function TutorIdentityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const identity = useTutorApplicationStore((s) => s.identity);
  const setIdentity = useTutorApplicationStore((s) => s.setIdentity);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // L'e-mail du dossier DOIT être celui du compte (le serveur refuse sinon : ACCOUNT_EMAIL_MISMATCH),
  // y compris si un autre compte a rempli ce formulaire avant. Nom et téléphone sont préremplis une
  // fois, tant que le formulaire est vierge — le candidat peut les modifier.
  useEffect(() => {
    if (!authUser) return;
    const patch: Partial<typeof identity> = {};
    if (identity.email !== authUser.email) patch.email = authUser.email;
    if (!identity.firstName && !identity.lastName) {
      patch.firstName = authUser.firstName;
      patch.lastName = authUser.lastName;
    }
    if (!identity.phone && authUser.phone) patch.phone = authUser.phone;
    if (Object.keys(patch).length) setIdentity(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const canContinue =
    identity.firstName.trim().length > 0 &&
    identity.lastName.trim().length > 0 &&
    !!identity.gender &&
    identity.birthDate.trim().length > 0 &&
    identity.phone.trim().length > 0 &&
    identity.email.trim().length > 0;

  const continueToBackground = () => {
    const errors: FieldErrors = {};
    if (!identity.firstName.trim()) errors.firstName = "Le prénom est requis.";
    if (!identity.lastName.trim()) errors.lastName = "Le nom est requis.";
    if (!identity.gender) errors.gender = "Indiquez votre sexe : il détermine votre avatar tant que vous n'avez pas de photo.";

    const birthMatch = identity.birthDate.trim().match(BIRTH_DATE_REGEX);
    if (!birthMatch) {
      errors.birthDate = "Format attendu : JJ/MM/AAAA.";
    } else {
      const d = parseInt(birthMatch[1], 10);
      const m = parseInt(birthMatch[2], 10);
      const y = parseInt(birthMatch[3], 10);
      const currentYear = new Date().getFullYear();
      if (d < 1 || d > 31 || m < 1 || m > 12) {
        errors.birthDate = "Date de naissance invalide.";
      } else if (y < 1920 || y > currentYear - 15) {
        errors.birthDate = `L'année doit être comprise entre 1920 et ${currentYear - 15}.`;
      }
    }

    if (!PHONE_REGEX.test(identity.phone.trim())) errors.phone = "Format de téléphone invalide.";
    if (!EMAIL_REGEX.test(identity.email.trim())) errors.email = "Format d'email invalide.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    router.push(TUTOR_BACKGROUND_ROUTE);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthHeader onBack={() => router.back()} />
      <StepProgress step={1} total={TOTAL_STEPS} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={40}>
          <Text className="mb-1 text-[24px] font-bold text-ink">Vos informations personnelles</Text>
          <Text className="mb-5 text-[13.5px] text-ink-soft">Elles ne sont visibles que par EduLoc</Text>
        </FadeIn>

        <FadeIn delay={90}>
          <TextField
            label="Prénom"
            value={identity.firstName}
            onChangeText={(firstName) => setIdentity({ firstName })}
            placeholder="Jean"
            autoComplete="given-name"
            textContentType="givenName"
            error={fieldErrors.firstName}
          />
          <TextField
            label="Nom"
            value={identity.lastName}
            onChangeText={(lastName) => setIdentity({ lastName })}
            placeholder="Rakoto"
            autoComplete="family-name"
            textContentType="familyName"
            error={fieldErrors.lastName}
          />
          {/* Sexe : détermine l'avatar par défaut (silhouette) du tuteur */}
          <View className="mb-[14px]">
            <Text className="mb-[6px] ml-0.5 text-[12.5px] font-semibold uppercase tracking-[0.03em] text-ink-soft">Sexe</Text>
            <View className="flex-row gap-3">
              {([
                { id: "male", label: "Homme" },
                { id: "female", label: "Femme" },
              ] as const).map((option) => {
                const active = identity.gender === option.id;
                return (
                  <PressableScale
                    key={option.id}
                    onPress={() => setIdentity({ gender: option.id })}
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: active }}
                    style={{ flex: 1 }}
                  >
                    <View className={["flex-row items-center gap-3 rounded-lg border px-3 py-2.5", active ? "border-primary bg-primary-tint/40" : fieldErrors.gender ? "border-error bg-surface" : "border-line bg-surface"].join(" ")}>
                      <TutorAvatar gender={option.id} size={40} />
                      <Text className={["text-[14.5px] font-bold", active ? "text-primary" : "text-ink-soft"].join(" ")}>{option.label}</Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
            {fieldErrors.gender ? <Text className="mt-[6px] ml-0.5 text-[12.5px] text-error">{fieldErrors.gender}</Text> : null}
          </View>
          <BirthDateField
            label="Date de naissance"
            value={identity.birthDate}
            onChangeText={(birthDate) => setIdentity({ birthDate })}
            error={fieldErrors.birthDate}
          />
          <PhoneInputField
            label="Téléphone"
            value={identity.phone}
            onChangeText={(phone) => setIdentity({ phone })}
            error={fieldErrors.phone}
          />
          <TextField
            label="Email du compte"
            value={identity.email}
            onChangeText={(email) => setIdentity({ email })}
            placeholder="jean.rakoto@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={fieldErrors.email}
            editable={false}
          />
        </FadeIn>
      </ScrollView>

      <View
        className="border-t border-line-soft bg-surface px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 22) }}
      >
        <Button label="Continuer" disabled={!canContinue} onPress={continueToBackground} />
      </View>
    </KeyboardAvoidingView>
  );
}

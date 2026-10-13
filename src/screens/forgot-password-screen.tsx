import { type Href, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion/fade-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/ui/code-input";
import { FormError } from "@/components/ui/form-error";
import { TextField } from "@/components/ui/text-field";
import { useForgotPassword } from "@/hooks/use-forgot-password";

const LOGIN_ROUTE = "/login" as Href;

export function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const form = useForgotPassword();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthHeader onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {form.step === "email" ? (
          <>
            <FadeIn delay={40}>
              <Text className="mb-[6px] text-[25px] font-bold text-ink">Mot de passe oublié</Text>
              <Text className="mb-6 text-[14px] text-ink-soft">
                Indiquez l&apos;e-mail de votre compte : nous vous envoyons un code à 6 chiffres.
              </Text>
            </FadeIn>
            <FadeIn delay={100}>
              {form.formError ? <FormError message={form.formError} /> : null}
              <TextField
                label="Email"
                value={form.email}
                onChangeText={form.setEmail}
                placeholder="vous@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                error={form.fieldErrors.email}
                editable={!form.isSubmitting}
              />
              <View className="mt-2">
                <Button
                  label="Envoyer le code"
                  loading={form.isSubmitting}
                  loadingLabel="Envoi..."
                  disabled={!form.email.trim() || form.isSubmitting}
                  onPress={form.requestCode}
                  fullWidth
                />
              </View>
            </FadeIn>
          </>
        ) : null}

        {form.step === "reset" ? (
          <>
            <FadeIn delay={40}>
              <Text className="mb-[6px] text-[25px] font-bold text-ink">Nouveau mot de passe</Text>
              <Text className="mb-6 text-[14px] text-ink-soft">
                Si un compte existe pour <Text className="font-bold text-ink">{form.email.trim()}</Text>, un code vient
                d&apos;être envoyé. Saisissez-le puis choisissez un nouveau mot de passe.
              </Text>
            </FadeIn>
            <FadeIn delay={100}>
              {form.formError ? <FormError message={form.formError} /> : null}
              <View className="mb-5">
                <CodeInput value={form.code} onChange={form.setCode} disabled={form.isSubmitting} hasError={!!form.formError} />
              </View>
              <TextField
                label="Nouveau mot de passe"
                value={form.password}
                onChangeText={form.setPassword}
                placeholder="8 caractères minimum"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                error={form.fieldErrors.password}
                editable={!form.isSubmitting}
              />
              <View className="mt-2">
                <Button
                  label="Changer le mot de passe"
                  loading={form.isSubmitting}
                  loadingLabel="Enregistrement..."
                  disabled={form.code.length !== 6 || !form.password || form.isSubmitting}
                  onPress={form.resetPassword}
                  fullWidth
                />
              </View>
              <PressableScale onPress={form.backToEmail} accessibilityLabel="Utiliser une autre adresse e-mail">
                <Text className="mt-5 text-center text-[13.5px] font-semibold text-primary">Utiliser une autre adresse</Text>
              </PressableScale>
            </FadeIn>
          </>
        ) : null}

        {form.step === "done" ? (
          <FadeIn delay={40}>
            <Text className="mb-[6px] text-[25px] font-bold text-ink">Mot de passe modifié</Text>
            <Text className="mb-6 text-[14px] text-ink-soft">
              Vos appareils ont été déconnectés par sécurité. Connectez-vous avec votre nouveau mot de passe.
            </Text>
            <Button label="Se connecter" onPress={() => router.replace(LOGIN_ROUTE)} fullWidth />
          </FadeIn>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

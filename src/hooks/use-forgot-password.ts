import { useCallback, useState } from "react";

import { AuthService, AuthServiceError } from "@/services/auth.service";

export type ForgotPasswordStep = "email" | "reset" | "done";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Réinitialisation du mot de passe en deux temps :
 *  1. email → POST /auth/password/request (un code à 6 chiffres est envoyé si le compte existe ;
 *     la réponse ne révèle jamais l'existence du compte) ;
 *  2. code + nouveau mot de passe → POST /auth/password/reset (toutes les sessions sont révoquées).
 */
export function useForgotPassword() {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestCode = useCallback(async () => {
    if (isSubmitting) return;
    setFormError(null);
    if (!EMAIL_REGEX.test(email.trim())) {
      setFieldErrors({ email: "Format d'email invalide." });
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await AuthService.requestPasswordReset(email);
      setStep("reset");
    } catch (error) {
      setFormError(error instanceof AuthServiceError ? error.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isSubmitting]);

  const resetPassword = useCallback(async () => {
    if (isSubmitting) return;
    setFormError(null);
    if (code.length !== 6) {
      setFormError("Saisissez les 6 chiffres du code reçu par e-mail.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldErrors({ password: `Au moins ${MIN_PASSWORD_LENGTH} caractères.` });
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await AuthService.resetPassword({ email, code, password });
      setStep("done");
    } catch (error) {
      setFormError(error instanceof AuthServiceError ? error.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }, [code, email, isSubmitting, password]);

  return {
    step,
    email,
    setEmail,
    code,
    setCode,
    password,
    setPassword,
    fieldErrors,
    formError,
    isSubmitting,
    requestCode,
    resetPassword,
    backToEmail: () => {
      setStep("email");
      setCode("");
      setFormError(null);
    },
  };
}

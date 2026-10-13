import { useCallback, useState } from "react";

import { AuthService, AuthServiceError } from "@/services/auth.service";
import type { AuthenticatedUser } from "@/types/auth";

type Field = "firstName" | "lastName" | "email" | "phone" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,}$/;
const MIN_PASSWORD_LENGTH = 8;

export function useSignupForm(onSuccess: (user: AuthenticatedUser) => void) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback(() => {
    const errors: FieldErrors = {};
    if (!firstName.trim()) errors.firstName = "Le prénom est requis.";
    if (!lastName.trim()) errors.lastName = "Le nom est requis.";
    if (!email.trim()) errors.email = "L'email est requis.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Format d'email invalide.";
    if (!phone.trim()) errors.phone = "Le téléphone est requis.";
    else if (!PHONE_REGEX.test(phone.trim())) errors.phone = "Format de téléphone invalide.";
    if (!password) errors.password = "Le mot de passe est requis.";
    else if (password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Au moins ${MIN_PASSWORD_LENGTH} caractères.`;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [firstName, lastName, email, phone, password]);

  const submit = useCallback(async () => {
    if (isSubmitting) return;
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await AuthService.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      onSuccess(user);
    } catch (error) {
      setFormError(
        error instanceof AuthServiceError ? error.message : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, lastName, email, phone, password, isSubmitting, validate, onSuccess]);

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.length > 0 &&
    !isSubmitting;

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    fieldErrors,
    formError,
    isSubmitting,
    submit,
    canSubmit,
  };
}

const ALPHANUMERIC_REGEX = /^[a-z0-9]+$/i;
const WRONG_PASSWORD_ERROR = "Wrong password";

export function validatePassword(input: string): { valid: boolean; error: string | null } {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: WRONG_PASSWORD_ERROR };
  }

  if (!ALPHANUMERIC_REGEX.test(input)) {
    return { valid: false, error: WRONG_PASSWORD_ERROR };
  }

  return { valid: true, error: null };
}
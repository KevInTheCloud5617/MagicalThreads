export function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

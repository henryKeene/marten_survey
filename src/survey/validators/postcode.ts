/**
 * Validates a postcode as either a Northern Ireland UK postcode (BT-prefix)
 * or a Republic of Ireland Eircode. Everything else is rejected with a
 * reason code the UI can use to tailor the error message.
 */

export type PostcodeResult =
  | {
      ok: true;
      normalised: string;
      kind: "ni" | "ni-partial" | "eircode" | "eircode-partial" | "postcode";
    }
  | { ok: false; reason: "empty" | "unrecognised" };

const NI_REGEX = /^BT\d{1,2}\s\d[A-Z]{2}$/;
const EIRCODE_REGEX = /^[ACDEFHKNPRTVWXY][0-9W][0-9W]\s[0-9ACDEFHKNPRTVWXY]{4}$/;
// Partial-entry forms: just the outward code (NI) or just the routing key
// (Eircode). These let respondents share an area without giving the full,
// precisely-locating postcode.
const NI_PARTIAL_REGEX = /^BT\d{1,2}$/;
const EIRCODE_PARTIAL_REGEX = /^[ACDEFHKNPRTVWXY][0-9W][0-9W]$/;
const GENERIC_POSTCODE_REGEX = /^[A-Z0-9]{1,7}$/;

export function validateIrishOrNIPostcode(raw: string): PostcodeResult {
  if (!raw || !raw.trim()) return { ok: false, reason: "empty" };

  const s = raw.toUpperCase().replace(/\s+/g, " ").trim();
  const noSpace = s.replace(/\s/g, "");

  if (!GENERIC_POSTCODE_REGEX.test(noSpace)) {
    return { ok: false, reason: "unrecognised" };
  }

  if (noSpace.length > 7) {
    return { ok: false, reason: "unrecognised" };
  }

  // Try NI first: format is BT + 1-2 digits + 1 digit + 2 letters.
  // Insert a space before the last 3 characters.
  if (noSpace.length >= 5 && noSpace.startsWith("BT")) {
    const candidate = `${noSpace.slice(0, -3)} ${noSpace.slice(-3)}`;
    if (NI_REGEX.test(candidate)) {
      return { ok: true, normalised: candidate, kind: "ni" };
    }
  }

  // Partial NI outward code only (e.g. "BT12", "BT5", "BT56").
  if (NI_PARTIAL_REGEX.test(noSpace)) {
    return { ok: true, normalised: noSpace, kind: "ni-partial" };
  }

  // Eircode: 3 + 4, insert space before the last 4.
  if (noSpace.length === 7) {
    const candidate = `${noSpace.slice(0, 3)} ${noSpace.slice(3)}`;
    if (EIRCODE_REGEX.test(candidate)) {
      return { ok: true, normalised: candidate, kind: "eircode" };
    }
  }

  // Partial Eircode routing key only (e.g. "D02", "A63").
  if (EIRCODE_PARTIAL_REGEX.test(noSpace)) {
    return { ok: true, normalised: noSpace, kind: "eircode-partial" };
  }

  return { ok: true, normalised: noSpace, kind: "postcode" };
}

export type PostcodeReason = "empty" | "unrecognised";

export function postcodeErrorMessage(reason: PostcodeReason): string {
  switch (reason) {
    case "empty":
      return "Please enter your postcode.";
    case "unrecognised":
      return "Please enter up to 7 letters or numbers (spaces are optional).";
  }
}

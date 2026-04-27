import { describe, it, expect } from "vitest";
import { validateIrishOrNIPostcode } from "./postcode";

describe("validateIrishOrNIPostcode", () => {
  it("accepts NI postcodes in various formats", () => {
    for (const input of ["BT12 5AB", "bt12 5ab", "bt125ab", "  BT12  5AB  "]) {
      const r = validateIrishOrNIPostcode(input);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.kind).toBe("ni");
        expect(r.normalised).toBe("BT12 5AB");
      }
    }
  });

  it("accepts Eircodes in various formats", () => {
    for (const input of ["D02 X285", "d02x285", "D02X285", " d02 X285 "]) {
      const r = validateIrishOrNIPostcode(input);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.kind).toBe("eircode");
        expect(r.normalised).toBe("D02 X285");
      }
    }
  });

  it("rejects empty input", () => {
    const r = validateIrishOrNIPostcode("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("empty");
  });

  it("accepts shorter alphanumeric postcodes", () => {
    for (const input of ["12345", "HELLO", "A1B2C3"]) {
      const r = validateIrishOrNIPostcode(input);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.kind).toBe("postcode");
    }
  });

  it("rejects invalid postcode input", () => {
    for (const input of ["NOT A CODE!", "12345678", "BT12345@@"]) {
      const r = validateIrishOrNIPostcode(input);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe("unrecognised");
    }
  });

  it("accepts partial NI outward codes", () => {
    for (const input of ["BT56", "bt56", "BT5", "BT12", " bt9 "]) {
      const r = validateIrishOrNIPostcode(input);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.kind).toBe("ni-partial");
    }
  });

  it("accepts partial Eircode routing keys", () => {
    for (const input of ["D02", "a63", "N91"]) {
      const r = validateIrishOrNIPostcode(input);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.kind).toBe("eircode-partial");
    }
  });
});

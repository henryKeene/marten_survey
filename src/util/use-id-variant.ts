import { useEffect, useState } from "react";

const KEY = "wildlife-survey:id-variant";

export type IdVariant = "grid" | "drag";

/** Session-scoped preference for which species-ID interaction to render.
 *  Lets Leighanna A/B both variants from the same live URL — she'll cherry-
 *  pick whichever one she prefers and we delete the other. */
export function useIdVariant(): [IdVariant, (v: IdVariant) => void] {
  const [variant, setVariant] = useState<IdVariant>(() => {
    if (typeof window === "undefined") return "grid";
    const stored = window.sessionStorage.getItem(KEY);
    return stored === "drag" ? "drag" : "grid";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(KEY, variant);
    }
  }, [variant]);

  return [variant, setVariant];
}

import { useCallback, useRef, useState } from "react";

export interface DragNameChoice {
  value: string;
  label: string;
}

export interface DragNameIdentifyProps {
  imageSrc: string | null;
  imageAlt: string;
  choices: DragNameChoice[];
  notSureValue?: string;
  value: string | null;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

/**
 * Drag-the-photo onto a species name. Pointer-events based so it works for
 * touch and mouse identically. Tapping a name also commits the answer — the
 * drag is a delightful affordance, not the only way to answer.
 */
export function DragNameIdentify({
  imageSrc,
  imageAlt,
  choices,
  notSureValue = "not_sure",
  value,
  onChange,
  ariaLabel,
}: DragNameIdentifyProps) {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverValue, setHoverValue] = useState<string | null>(null);
  const targetRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const photoRef = useRef<HTMLDivElement>(null);

  const namedChoices = choices.filter((c) => c.value !== notSureValue);
  const notSure = choices.find((c) => c.value === notSureValue);

  const hitTest = useCallback((x: number, y: number): string | null => {
    for (const [val, el] of targetRefs.current.entries()) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return val;
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPos === null) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    setHoverValue(hitTest(e.clientX, e.clientY));
  };

  const endDrag = (commit: boolean, x?: number, y?: number) => {
    if (commit && x !== undefined && y !== undefined) {
      const v = hitTest(x, y);
      if (v) onChange(v);
    }
    setDragPos(null);
    setHoverValue(null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    endDrag(true, e.clientX, e.clientY);
  };

  const handlePointerCancel = () => endDrag(false);

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="space-y-4">
      <div className="text-center text-xs font-medium uppercase tracking-wide text-stone-500">
        Drag the photo onto a name — or tap a name to choose.
      </div>

      <div
        ref={photoRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={[
          "relative mx-auto aspect-[4/3] w-full max-w-md cursor-grab touch-none select-none overflow-hidden rounded-2xl border-2 bg-stone-100 active:cursor-grabbing",
          dragPos ? "border-forest-700 shadow-lg" : "border-stone-200",
        ].join(" ")}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`h-full w-full object-cover transition-opacity duration-150 ${
              dragPos ? "opacity-30" : "opacity-100"
            }`}
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-stone-500">
            Photo placeholder.
          </div>
        )}
        {dragPos === null && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-forest-800 shadow"
          >
            ✋ Drag me
          </span>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {namedChoices.map((choice) => {
          const isSelected = value === choice.value;
          const isHovered = hoverValue === choice.value;
          return (
            <li key={choice.value}>
              <button
                ref={(el) => {
                  if (el) targetRefs.current.set(choice.value, el);
                  else targetRefs.current.delete(choice.value);
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange(choice.value)}
                className={[
                  "w-full rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2",
                  isHovered
                    ? "scale-[1.02] border-forest-600 bg-forest-100 text-forest-900 shadow-md"
                    : isSelected
                      ? "border-forest-700 bg-forest-700 text-white shadow-md"
                      : "border-stone-300 bg-white text-stone-700 hover:border-forest-400 hover:bg-stone-50",
                ].join(" ")}
              >
                {choice.label}
              </button>
            </li>
          );
        })}
      </ul>

      {notSure && (
        <button
          type="button"
          role="radio"
          aria-checked={value === notSure.value}
          onClick={() => onChange(notSure.value)}
          className={[
            "w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium transition",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2",
            value === notSure.value
              ? "border-forest-700 bg-forest-700 text-white shadow-md"
              : "border-stone-300 bg-white text-stone-700 hover:border-forest-400 hover:bg-stone-50",
          ].join(" ")}
        >
          {notSure.label}
        </button>
      )}

      {dragPos && imageSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 h-24 w-32 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border-2 border-forest-700 shadow-2xl"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <img src={imageSrc} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

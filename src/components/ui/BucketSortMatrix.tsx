import { useCallback, useRef, useState } from "react";
import { LabelText } from "./LabelText";

export interface BucketSortBucket {
  /** Numeric value committed to the answer for items placed here. */
  value: number;
  /** Full label, used in the inline picker and aria. */
  label: string;
  /** Short label that fits on the sticky chip row. */
  shortLabel: string;
  /** Tailwind classes for the bucket chip / level badge. */
  color: string;
  textColor: string;
}

export interface BucketSortItem {
  id: string;
  icon?: string;
  contextLabel: string;
  /** Visual species tag — small colored dot + name on the card. */
  species: "pm" | "fox";
}

export interface BucketSortMatrixProps {
  prompt: string;
  hint?: string;
  buckets: BucketSortBucket[];
  items: BucketSortItem[];
  values: Record<string, number | null>;
  onChange: (itemId: string, value: number) => void;
}

const SPECIES_LABELS: Record<"pm" | "fox", { dot: string; name: string }> = {
  pm: { dot: "bg-forest-600", name: "Pine marten" },
  fox: { dot: "bg-amber", name: "Fox" },
};

/**
 * Risk-level sorting input. Replaces the old vertically-stacked bucket lanes
 * (which pushed buckets off-screen during a drag on mobile) with a sticky
 * horizontal chip row at the top of the page — the buckets are always one
 * thumb-flick away no matter how far the user has scrolled the card list.
 *
 * Each card shows its current level inline. Drag a card up to a chip to
 * commit, or tap a card to open an inline level picker.
 */
export function BucketSortMatrix({
  prompt,
  hint,
  buckets,
  items,
  values,
  onChange,
}: BucketSortMatrixProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [hoverBucket, setHoverBucket] = useState<number | null>(null);
  const [tapPickerId, setTapPickerId] = useState<string | null>(null);
  const chipRefs = useRef<Map<number, HTMLElement>>(new Map());

  const findBucketAt = useCallback((x: number, y: number): number | null => {
    for (const [val, el] of chipRefs.current.entries()) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return val;
      }
    }
    return null;
  }, []);

  const startDrag = (id: string, e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
    setGhost({ x: e.clientX, y: e.clientY });
    setTapPickerId(null);
  };

  const moveDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragId) return;
    setGhost({ x: e.clientX, y: e.clientY });
    setHoverBucket(findBucketAt(e.clientX, e.clientY));
  };

  const endDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragId) return;
    const target = findBucketAt(e.clientX, e.clientY);
    if (target !== null) onChange(dragId, target);
    setDragId(null);
    setGhost(null);
    setHoverBucket(null);
  };

  const cancelDrag = () => {
    setDragId(null);
    setGhost(null);
    setHoverBucket(null);
  };

  const counts = new Map<number, number>(buckets.map((b) => [b.value, 0]));
  let unsortedCount = 0;
  for (const item of items) {
    const v = values[item.id];
    if (typeof v === "number" && counts.has(v)) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    } else {
      unsortedCount++;
    }
  }
  const total = items.length;
  const placed = total - unsortedCount;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="!font-sans !text-base font-semibold !text-stone-900 leading-snug">
          <LabelText text={prompt} />
        </h3>
        {hint && <p className="mt-1 text-sm text-stone-600">{hint}</p>}
        <p className="mt-2 text-xs font-medium text-forest-700">
          {placed} of {total} sorted
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 border-b border-stone-200 bg-stone-50 px-4 py-3 md:-mx-10 md:px-10">
        <div className="grid grid-cols-5 gap-1.5">
          {buckets.map((bucket) => {
            const count = counts.get(bucket.value) ?? 0;
            const isHover = hoverBucket === bucket.value;
            return (
              <div
                key={bucket.value}
                ref={(el) => {
                  if (el) chipRefs.current.set(bucket.value, el);
                  else chipRefs.current.delete(bucket.value);
                }}
                className={[
                  "flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center transition-all",
                  bucket.color,
                  isHover
                    ? "scale-105 border-stone-900 ring-4 ring-forest-300"
                    : "border-transparent",
                ].join(" ")}
              >
                <span
                  className={`text-[10px] font-bold uppercase leading-tight tracking-wide ${bucket.textColor}`}
                >
                  {bucket.shortLabel}
                </span>
                <span className={`text-xs font-bold ${bucket.textColor}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const v = values[item.id];
          const bucket =
            typeof v === "number"
              ? (buckets.find((b) => b.value === v) ?? null)
              : null;
          const isPickerOpen = tapPickerId === item.id;
          return (
            <li key={item.id}>
              <SortableCard
                item={item}
                bucket={bucket}
                isDragging={dragId === item.id}
                onPointerDown={(e) => startDrag(item.id, e)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={cancelDrag}
                onTap={() =>
                  setTapPickerId((cur) => (cur === item.id ? null : item.id))
                }
              />
              {isPickerOpen && (
                <TapPicker
                  buckets={buckets}
                  selected={typeof v === "number" ? v : null}
                  onPick={(val) => {
                    onChange(item.id, val);
                    setTapPickerId(null);
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>

      {ghost && dragId && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-forest-700 bg-white px-3 py-2 text-sm font-semibold shadow-2xl"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {(() => {
            const item = items.find((i) => i.id === dragId);
            return item ? <CardCore item={item} /> : null;
          })()}
        </div>
      )}
    </section>
  );
}

function SortableCard({
  item,
  bucket,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onTap,
}: {
  item: BucketSortItem;
  bucket: BucketSortBucket | null;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTap: () => void;
}) {
  const downRef = useRef<{ x: number; y: number; movedFar: boolean } | null>(
    null,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${SPECIES_LABELS[item.species].name} — ${item.contextLabel}${
        bucket ? ` — ${bucket.label}` : ""
      }`}
      onPointerDown={(e) => {
        downRef.current = { x: e.clientX, y: e.clientY, movedFar: false };
        onPointerDown(e);
      }}
      onPointerMove={(e) => {
        if (downRef.current) {
          const dx = e.clientX - downRef.current.x;
          const dy = e.clientY - downRef.current.y;
          if (dx * dx + dy * dy > 25) downRef.current.movedFar = true;
        }
        onPointerMove(e);
      }}
      onPointerUp={(e) => {
        const wasTap = downRef.current && !downRef.current.movedFar;
        downRef.current = null;
        onPointerUp(e);
        if (wasTap) onTap();
      }}
      onPointerCancel={(e) => {
        downRef.current = null;
        onPointerCancel(e);
      }}
      className={[
        "flex w-full cursor-grab touch-none select-none items-center gap-3 rounded-xl border-2 bg-white px-3 py-3 shadow-sm transition active:cursor-grabbing",
        isDragging
          ? "border-forest-700 opacity-30"
          : "border-stone-200 hover:border-forest-400",
      ].join(" ")}
    >
      <span aria-hidden="true" className="text-stone-400">
        ⋮⋮
      </span>
      <div className="min-w-0 flex-1">
        <CardCore item={item} />
      </div>
      {bucket ? (
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${bucket.color} ${bucket.textColor}`}
        >
          {bucket.shortLabel}
        </span>
      ) : (
        <span className="shrink-0 rounded-full border border-dashed border-stone-300 px-3 py-1 text-xs font-medium text-stone-500">
          Tap or drag
        </span>
      )}
    </div>
  );
}

function CardCore({ item }: { item: BucketSortItem }) {
  const sp = SPECIES_LABELS[item.species];
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {item.icon && (
        <span aria-hidden="true" className="text-base">
          {item.icon}
        </span>
      )}
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${sp.dot}`}
      />
      <span className="text-stone-800">
        <span className="font-bold">{sp.name}</span>
        <span className="text-stone-500"> · </span>
        <span>{item.contextLabel}</span>
      </span>
    </span>
  );
}

function TapPicker({
  buckets,
  selected,
  onPick,
}: {
  buckets: BucketSortBucket[];
  selected: number | null;
  onPick: (v: number) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-5 gap-1.5 rounded-xl border border-stone-300 bg-white p-2 shadow-md">
      {buckets.map((b) => {
        const isSelected = selected === b.value;
        return (
          <button
            key={b.value}
            type="button"
            onClick={() => onPick(b.value)}
            aria-label={b.label}
            aria-pressed={isSelected}
            className={[
              "flex flex-col items-center justify-center rounded-lg border-2 px-1 py-2 text-center transition",
              b.color,
              isSelected ? "border-stone-900 ring-2 ring-forest-300" : "border-transparent hover:border-stone-700",
            ].join(" ")}
          >
            <span
              className={`text-[10px] font-bold uppercase leading-tight tracking-wide ${b.textColor}`}
            >
              {b.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

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
  species: "pm" | "fox";
  question: string;
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
 * Risk-level sorting input. Cards carry the full plain-English question they
 * represent ("How risky are pine martens to pets nearby?") so the user knows
 * what they're rating, not just a 'PM · Pets' label.
 *
 * Workflow: drag or tap a card → it commits to a bucket and *leaves* the
 * to-sort list. Tapping a chip in the sticky bucket row expands the chip
 * inline so the user can see and re-sort what's inside. The list shrinks as
 * the user works, which also fixes the mobile cut-off-at-the-bottom issue.
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
  const [expandedBucket, setExpandedBucket] = useState<number | null>(null);
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
  const inBucket = new Map<number, BucketSortItem[]>(
    buckets.map((b) => [b.value, []]),
  );
  const unsorted: BucketSortItem[] = [];
  for (const item of items) {
    const v = values[item.id];
    if (typeof v === "number" && counts.has(v)) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
      inBucket.get(v)!.push(item);
    } else {
      unsorted.push(item);
    }
  }
  const total = items.length;
  const placed = total - unsorted.length;

  const expandedItems =
    expandedBucket !== null ? (inBucket.get(expandedBucket) ?? []) : [];

  return (
    <section className="space-y-4">
      <div>
        <h3 className="!font-sans !text-base font-semibold !text-stone-900 leading-snug">
          <LabelText text={prompt} />
        </h3>
        {hint && <p className="mt-1 text-sm text-stone-600">{hint}</p>}
      </div>

      <div className="sticky top-0 z-10 -mx-4 border-b border-stone-200 bg-stone-50 px-4 py-3 md:-mx-10 md:px-10">
        <div className="grid grid-cols-5 gap-1.5">
          {buckets.map((bucket) => {
            const count = counts.get(bucket.value) ?? 0;
            const isHover = hoverBucket === bucket.value;
            const isExpanded = expandedBucket === bucket.value;
            return (
              <button
                key={bucket.value}
                ref={(el) => {
                  if (el) chipRefs.current.set(bucket.value, el);
                  else chipRefs.current.delete(bucket.value);
                }}
                type="button"
                onClick={() =>
                  setExpandedBucket((cur) =>
                    cur === bucket.value ? null : bucket.value,
                  )
                }
                aria-label={`${bucket.label} — ${count} placed${
                  isExpanded ? ", expanded" : ", tap to expand"
                }`}
                aria-expanded={isExpanded}
                disabled={count === 0 && !isHover}
                className={[
                  "flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center transition-all",
                  bucket.color,
                  isHover
                    ? "scale-105 border-stone-900 ring-4 ring-forest-300"
                    : isExpanded
                      ? "border-stone-900 ring-2 ring-stone-900"
                      : "border-transparent",
                  count === 0 && !isHover ? "opacity-60" : "",
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
              </button>
            );
          })}
        </div>
      </div>

      {expandedBucket !== null && (
        <div
          className={`rounded-xl border-2 p-3 ${
            buckets.find((b) => b.value === expandedBucket)?.color ?? ""
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                buckets.find((b) => b.value === expandedBucket)?.textColor ?? ""
              }`}
            >
              {buckets.find((b) => b.value === expandedBucket)?.label} ·{" "}
              {expandedItems.length}
            </span>
            <button
              type="button"
              onClick={() => setExpandedBucket(null)}
              className="text-xs font-medium text-stone-700 underline underline-offset-2"
            >
              Close
            </button>
          </div>
          {expandedItems.length === 0 ? (
            <p className="text-xs italic text-stone-600">
              Nothing here yet — drag or tap a card below into this level.
            </p>
          ) : (
            <ul className="space-y-2">
              {expandedItems.map((item) => (
                <li key={item.id}>
                  <SortableCard
                    item={item}
                    bucket={buckets.find((b) => b.value === expandedBucket) ?? null}
                    isDragging={dragId === item.id}
                    compact
                    onPointerDown={(e) => startDrag(item.id, e)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={cancelDrag}
                    onTap={() =>
                      setTapPickerId((cur) =>
                        cur === item.id ? null : item.id,
                      )
                    }
                  />
                  {tapPickerId === item.id && (
                    <TapPicker
                      buckets={buckets}
                      selected={values[item.id] as number | null}
                      onPick={(val) => {
                        onChange(item.id, val);
                        setTapPickerId(null);
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-forest-700">
          {unsorted.length === 0
            ? `✓ All ${total} sorted — tap any chip above to review or change.`
            : `${placed} of ${total} sorted · ${unsorted.length} to go`}
        </p>
        <ul className="space-y-2">
          {unsorted.map((item) => (
            <li key={item.id}>
              <SortableCard
                item={item}
                bucket={null}
                isDragging={dragId === item.id}
                onPointerDown={(e) => startDrag(item.id, e)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={cancelDrag}
                onTap={() =>
                  setTapPickerId((cur) => (cur === item.id ? null : item.id))
                }
              />
              {tapPickerId === item.id && (
                <TapPicker
                  buckets={buckets}
                  selected={null}
                  onPick={(val) => {
                    onChange(item.id, val);
                    setTapPickerId(null);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      {ghost && dragId && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-forest-700 bg-white px-3 py-2 text-sm font-semibold shadow-2xl"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {(() => {
            const item = items.find((i) => i.id === dragId);
            return item ? <CardHeaderRow item={item} /> : null;
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
  compact,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onTap,
}: {
  item: BucketSortItem;
  bucket: BucketSortBucket | null;
  isDragging: boolean;
  compact?: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTap: () => void;
}) {
  const downRef = useRef<{ x: number; y: number; movedFar: boolean } | null>(
    null,
  );

  const sp = SPECIES_LABELS[item.species];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${sp.name} — ${item.question}${
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
        "flex w-full cursor-grab touch-none select-none items-stretch gap-3 rounded-xl border-2 bg-white px-3 py-3 shadow-sm transition active:cursor-grabbing",
        isDragging
          ? "border-forest-700 opacity-30"
          : "border-stone-200 hover:border-forest-400",
      ].join(" ")}
    >
      <span aria-hidden="true" className="self-center text-stone-400">
        ⋮⋮
      </span>
      <div className="min-w-0 flex-1">
        <CardHeaderRow item={item} />
        {!compact && (
          <p className="mt-1.5 text-sm leading-snug text-stone-800">
            {item.question}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        {bucket ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${bucket.color} ${bucket.textColor}`}
          >
            {bucket.shortLabel}
          </span>
        ) : (
          <span className="rounded-full border border-dashed border-stone-300 px-3 py-1 text-xs font-medium text-stone-500">
            Tap or drag
          </span>
        )}
      </div>
    </div>
  );
}

function CardHeaderRow({ item }: { item: BucketSortItem }) {
  const sp = SPECIES_LABELS[item.species];
  return (
    <div className="flex items-center gap-2 text-xs">
      {item.icon && (
        <span aria-hidden="true" className="text-base leading-none">
          {item.icon}
        </span>
      )}
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${sp.dot}`}
      />
      <span className="font-bold uppercase tracking-wide text-stone-700">
        {sp.name}
      </span>
      <span className="text-stone-500">·</span>
      <span className="text-stone-600">{item.contextLabel}</span>
    </div>
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
              isSelected
                ? "border-stone-900 ring-2 ring-forest-300"
                : "border-transparent hover:border-stone-700",
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

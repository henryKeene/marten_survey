import { useCallback, useRef, useState } from "react";
import { LabelText } from "./LabelText";

export interface BucketSortBucket {
  /** Numeric value committed to the answer for items placed here. */
  value: number;
  label: string;
  /** Tailwind classes for the bucket lane. */
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
 * Drag-to-bucket sorting matrix. Each item is a card; each bucket is a colour-
 * coded lane. Drag a card into a lane to commit the corresponding value.
 *
 * Tap-to-pick fallback for accessibility: tapping a card opens an inline
 * level chooser. The drag is the delight; the tap is the fallback.
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
  const bucketRefs = useRef<Map<number, HTMLElement>>(new Map());
  const unsortedRef = useRef<HTMLDivElement>(null);

  const findBucketAt = useCallback((x: number, y: number): number | null => {
    for (const [val, el] of bucketRefs.current.entries()) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return val;
      }
    }
    return null;
  }, []);

  const startDrag = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
    setGhost({ x: e.clientX, y: e.clientY });
    setTapPickerId(null);
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragId) return;
    setGhost({ x: e.clientX, y: e.clientY });
    setHoverBucket(findBucketAt(e.clientX, e.clientY));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragId) return;
    const target = findBucketAt(e.clientX, e.clientY);
    if (target !== null) {
      onChange(dragId, target);
    }
    setDragId(null);
    setGhost(null);
    setHoverBucket(null);
  };

  const cancelDrag = () => {
    setDragId(null);
    setGhost(null);
    setHoverBucket(null);
  };

  // Group items by current bucket value (or "unsorted" if null/no match).
  const itemsByBucket = new Map<number | "unsorted", BucketSortItem[]>();
  itemsByBucket.set("unsorted", []);
  buckets.forEach((b) => itemsByBucket.set(b.value, []));
  for (const item of items) {
    const v = values[item.id];
    if (typeof v === "number" && buckets.some((b) => b.value === v)) {
      itemsByBucket.get(v)!.push(item);
    } else {
      itemsByBucket.get("unsorted")!.push(item);
    }
  }
  const unsorted = itemsByBucket.get("unsorted")!;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="!font-sans !text-base font-semibold !text-stone-900 leading-snug">
          <LabelText text={prompt} />
        </h3>
        {hint && <p className="mt-1 text-sm text-stone-600">{hint}</p>}
      </div>

      <div
        ref={unsortedRef}
        className={[
          "rounded-2xl border-2 border-dashed p-3 transition",
          unsorted.length === 0
            ? "border-forest-300 bg-forest-50"
            : "border-stone-300 bg-stone-50",
        ].join(" ")}
      >
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-stone-700">
          <span>{unsorted.length === 0 ? "✓ All sorted" : "Drag these into a level"}</span>
          <span>{unsorted.length} left</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {unsorted.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              onPointerDown={(e) => startDrag(item.id, e)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onTap={() =>
                setTapPickerId((cur) => (cur === item.id ? null : item.id))
              }
              isDragging={dragId === item.id}
            />
          ))}
        </div>
        {tapPickerId && unsorted.some((u) => u.id === tapPickerId) && (
          <TapPicker
            buckets={buckets}
            onPick={(v) => {
              onChange(tapPickerId, v);
              setTapPickerId(null);
            }}
          />
        )}
      </div>

      <ul className="space-y-2">
        {buckets.map((bucket) => {
          const inBucket = itemsByBucket.get(bucket.value) ?? [];
          const hovered = hoverBucket === bucket.value;
          return (
            <li
              key={bucket.value}
              ref={(el) => {
                if (el) bucketRefs.current.set(bucket.value, el);
                else bucketRefs.current.delete(bucket.value);
              }}
              className={[
                "rounded-2xl border-2 p-3 transition",
                bucket.color,
                hovered
                  ? "border-stone-900 ring-4 ring-forest-300"
                  : "border-transparent",
              ].join(" ")}
            >
              <div
                className={`mb-2 text-xs font-bold uppercase tracking-wide ${bucket.textColor}`}
              >
                {bucket.label}
              </div>
              {inBucket.length === 0 ? (
                <p className={`text-xs italic opacity-60 ${bucket.textColor}`}>
                  Drop items here
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {inBucket.map((item) => (
                    <SortableCard
                      key={item.id}
                      item={item}
                      onPointerDown={(e) => startDrag(item.id, e)}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={cancelDrag}
                      onTap={() =>
                        setTapPickerId((cur) =>
                          cur === item.id ? null : item.id,
                        )
                      }
                      isDragging={dragId === item.id}
                      placed
                    />
                  ))}
                </div>
              )}
              {tapPickerId && inBucket.some((i) => i.id === tapPickerId) && (
                <TapPicker
                  buckets={buckets}
                  onPick={(v) => {
                    onChange(tapPickerId, v);
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
            return item ? <CardInner item={item} /> : null;
          })()}
        </div>
      )}
    </section>
  );
}

function SortableCard({
  item,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onTap,
  isDragging,
  placed,
}: {
  item: BucketSortItem;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTap: () => void;
  isDragging: boolean;
  placed?: boolean;
}) {
  // Track whether the gesture moved enough to be a drag vs a tap.
  const downRef = useRef<{ x: number; y: number; movedFar: boolean } | null>(
    null,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${SPECIES_LABELS[item.species].name} — ${item.contextLabel}`}
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
        "group inline-flex cursor-grab touch-none select-none items-center gap-2 rounded-xl border-2 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition active:cursor-grabbing",
        isDragging ? "border-forest-700 opacity-30" : "border-stone-200",
        placed ? "" : "hover:border-forest-400",
      ].join(" ")}
    >
      <CardInner item={item} />
    </div>
  );
}

function CardInner({ item }: { item: BucketSortItem }) {
  const sp = SPECIES_LABELS[item.species];
  return (
    <>
      {item.icon && <span aria-hidden="true">{item.icon}</span>}
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${sp.dot}`}
      />
      <span className="text-stone-800">
        <span className="font-bold">{sp.name}</span>
        <span className="text-stone-500"> · </span>
        <span>{item.contextLabel}</span>
      </span>
    </>
  );
}

function TapPicker({
  buckets,
  onPick,
}: {
  buckets: BucketSortBucket[];
  onPick: (v: number) => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-stone-300 bg-white p-2 shadow-md">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-stone-600">
        Or tap a level
      </p>
      <div className="flex flex-wrap gap-2">
        {buckets.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => onPick(b.value)}
            className={`rounded-lg border-2 border-transparent px-3 py-2 text-xs font-semibold ${b.color} ${b.textColor} hover:border-stone-900`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

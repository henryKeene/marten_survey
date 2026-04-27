interface RegionConfig {
  value: string;
  label: string;
  /** Path describing this region's shape inside the viewBox. */
  d: string;
  /** Rough centroid for the inline label, in viewBox units. */
  labelXY: [number, number];
  /** Tailwind class for the fill. */
  fill: string;
  /** Counties hint shown below the map after selection. */
  counties: string;
}

const REGIONS: RegionConfig[] = [
  {
    value: "ulster",
    label: "Ulster",
    counties: "Donegal, Derry, Antrim, Down, Armagh, Tyrone, Fermanagh, Cavan, Monaghan",
    d: "M 35 20 L 80 8 L 135 10 L 175 25 L 185 70 L 175 100 L 105 105 L 30 92 Z",
    labelXY: [105, 60],
    fill: "fill-forest-600",
  },
  {
    value: "connacht",
    label: "Connacht",
    counties: "Galway, Mayo, Sligo, Roscommon, Leitrim",
    d: "M 30 92 L 105 105 L 100 215 L 30 215 L 8 175 L 5 130 Z",
    labelXY: [55, 165],
    fill: "fill-forest-400",
  },
  {
    value: "leinster",
    label: "Leinster",
    counties: "Dublin, Wicklow, Wexford, Kildare, Meath, Louth, Westmeath, Offaly, Laois, Carlow, Kilkenny, Longford",
    d: "M 105 105 L 175 100 L 192 175 L 175 235 L 100 232 L 100 215 Z",
    labelXY: [142, 170],
    fill: "fill-amber",
  },
  {
    value: "munster",
    label: "Munster",
    counties: "Cork, Kerry, Limerick, Tipperary, Waterford, Clare",
    d: "M 30 215 L 100 215 L 100 232 L 175 235 L 168 268 L 100 285 L 32 270 L 22 240 Z",
    labelXY: [95, 248],
    fill: "fill-forest-500",
  },
];

export interface IslandMapProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function IslandMap({ value, onChange }: IslandMapProps) {
  const selected = REGIONS.find((r) => r.value === value);

  return (
    <div className="space-y-3">
      <div className="mx-auto w-full max-w-sm">
        <svg
          viewBox="0 0 200 300"
          className="block h-auto w-full select-none"
          role="group"
          aria-label="Map of Ireland — tap a region"
        >
          {/* soft sea drop-shadow */}
          <defs>
            <filter id="islandShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feFlood floodColor="#000" floodOpacity="0.12" />
              <feComposite in2="offsetblur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#islandShadow)">
            {REGIONS.map((r) => {
              const isSelected = value === r.value;
              return (
                <g key={r.value}>
                  <path
                    d={r.d}
                    role="button"
                    aria-label={r.label}
                    aria-pressed={isSelected}
                    tabIndex={0}
                    onClick={() => onChange(r.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onChange(r.value);
                      }
                    }}
                    className={[
                      "cursor-pointer transition-all duration-150",
                      r.fill,
                      isSelected
                        ? "opacity-100"
                        : "opacity-80 hover:opacity-100",
                    ].join(" ")}
                    stroke={isSelected ? "#263424" : "#fafaf6"}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    x={r.labelXY[0]}
                    y={r.labelXY[1]}
                    textAnchor="middle"
                    pointerEvents="none"
                    className="fill-white"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    }}
                  >
                    {r.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {selected ? (
        <p className="text-center text-sm">
          <span className="font-semibold text-forest-800">{selected.label}</span>
          <span className="block text-xs text-stone-600">{selected.counties}</span>
        </p>
      ) : (
        <p className="text-center text-sm text-stone-600">
          Tap the part of the island where you live.
        </p>
      )}
    </div>
  );
}

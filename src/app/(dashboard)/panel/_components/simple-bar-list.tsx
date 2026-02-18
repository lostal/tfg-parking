/**
 * SimpleBarList
 *
 * A pure-CSS horizontal bar list for showing ranked items.
 * Copied from shadcn-admin analytics.tsx pattern — no recharts needed.
 */

interface SimpleBarListItem {
  name: string;
  value: number;
}

interface SimpleBarListProps {
  items: SimpleBarListItem[];
  valueFormatter?: (n: number) => string;
  /** Tailwind bg class for the fill bar */
  barClass?: string;
}

export function SimpleBarList({
  items,
  valueFormatter = (n) => String(n),
  barClass = "bg-primary",
}: SimpleBarListProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const width = `${Math.round((item.value / max) * 100)}%`;
        return (
          <li
            key={item.name}
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground mb-1 truncate text-xs">
                {item.name}
              </div>
              <div className="bg-muted h-2.5 w-full rounded-full">
                <div
                  className={`h-2.5 rounded-full transition-all ${barClass}`}
                  style={{ width }}
                />
              </div>
            </div>
            <div className="ps-2 text-xs font-medium tabular-nums">
              {valueFormatter(item.value)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

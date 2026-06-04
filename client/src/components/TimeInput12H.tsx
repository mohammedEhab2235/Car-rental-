import { useMemo } from "react";

export default function TimeInput12H({
  label,
  value,
  onChange,
  dir = "ltr"
}: {
  label: string;
  value: string; // HH:MM (24h)
  onChange: (time24: string) => void;
  dir?: "ltr" | "rtl";
}) {
  const { hour12, minute, period } = useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour12: "12", minute: "00", period: "ص" as const };
    }
    const [h, m] = value.split(":").map((v) => parseInt(v, 10));
    const period = h >= 12 ? ("م" as const) : ("ص" as const);
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hour12: String(hour12), minute: String(m).padStart(2, "0"), period };
  }, [value]);

  function update(h12: string, min: string, per: "ص" | "م") {
    const h = parseInt(h12, 10);
    const m = parseInt(min, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return;

    let h24: number;
    if (per === "ص") {
      h24 = h === 12 ? 0 : h;
    } else {
      h24 = h === 12 ? 12 : h + 12;
    }
    const time24 = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(time24);
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-white/80">{label}</div>
      <div className="flex items-center gap-2" dir={dir}>
        <select
          className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-base text-white outline-none transition focus:border-white/20 focus:ring-4 focus:ring-[#D10F1A]/15 sm:text-sm"
          value={hour12}
          onChange={(e) => update(e.target.value, minute, period)}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-white/60">:</span>
        <select
          className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-base text-white outline-none transition focus:border-white/20 focus:ring-4 focus:ring-[#D10F1A]/15 sm:text-sm"
          value={minute}
          onChange={(e) => update(hour12, e.target.value, period)}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-base text-white outline-none transition focus:border-white/20 focus:ring-4 focus:ring-[#D10F1A]/15 sm:text-sm"
          value={period}
          onChange={(e) => update(hour12, minute, e.target.value as "ص" | "م")}
        >
          <option value="ص">ص</option>
          <option value="م">م</option>
        </select>
      </div>
    </div>
  );
}

import { ShieldCheck, RotateCcw, Zap, Lock } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "Secure checkout", sub: "256-bit encryption" },
  { icon: RotateCcw, label: "14-day returns", sub: "Hassle-free policy" },
  { icon: Zap, label: "Ships same day", sub: "Orders before 2pm" },
  { icon: Lock, label: "Age verified", sub: "18+ only" },
];

export default function TrustBadges({ className = "" }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {BADGES.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex items-center gap-2.5 border border-hairline rounded-sm px-3 py-2.5">
          <Icon className="w-4 h-4 text-flame shrink-0" />
          <div>
            <p className="text-xs font-medium text-paper leading-tight">{label}</p>
            <p className="text-[11px] text-steel leading-tight">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

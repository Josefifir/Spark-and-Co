"use client";

/**
 * Personalisation preview — shows a simple SVG mock lighter
 * with the engraving text overlaid, so customers can see roughly
 * how it'll look before ordering.
 */
export default function PersonalisationPreview({ text, maxLength = 20 }) {
  if (!text) return null;

  const displayText = text.slice(0, maxLength);
  // Scale font size down for longer text
  const fontSize = displayText.length <= 8 ? 14 : displayText.length <= 14 ? 11 : 9;

  return (
    <div className="mt-3 mb-4">
      <p className="text-xs font-mono-tech text-steel uppercase tracking-wider mb-2">Preview</p>
      <div className="inline-block">
        <svg width="180" height="80" viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg">
          {/* Lighter body */}
          <rect x="30" y="8" width="120" height="64" rx="8" fill="#26282c" stroke="#34363b" strokeWidth="1.5" />
          {/* Lighter face plate */}
          <rect x="38" y="16" width="104" height="48" rx="5" fill="#1f2023" />
          {/* Engraving area */}
          <rect x="48" y="26" width="84" height="28" rx="3" fill="#16171a" stroke="#34363b" strokeWidth="1" strokeDasharray="4 2" />
          {/* Engraving text */}
          <text
            x="90"
            y="43"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontFamily="monospace"
            fill="#ff7a1a"
            letterSpacing="1"
          >
            {displayText}
          </text>
          {/* Sheen highlight */}
          <rect x="38" y="16" width="12" height="48" rx="5" fill="white" opacity="0.04" />
        </svg>
        <p className="text-[10px] text-steel text-center mt-1">Approximate preview — actual engraving may vary</p>
      </div>
    </div>
  );
}

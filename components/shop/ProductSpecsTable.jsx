"use client";

export default function ProductSpecsTable({ specs }) {
  if (!specs || specs.length === 0) return null;

  return (
    <div className="mt-8 border-t border-hairline pt-6">
      <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">
        Specifications
      </h3>
      <div className="border border-hairline rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-hairline">
            {specs.map((spec, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-paper-dim font-mono-tech text-xs uppercase tracking-wider bg-panel w-2/5">
                  {spec.label}
                </td>
                <td className="px-4 py-2.5 text-paper">
                  {spec.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Compact label/value rows used inside confirm-dialog previews.
 */
export default function PreviewRows({ rows }) {
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-start justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium flex-shrink-0">{r.label}</span>
          <span className="text-slate-800 font-semibold text-right min-w-0 break-words">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
/**
 * Coded illustrations for the non-AI pillars ("how it looks"), drawn in the
 * brand palette on the console's dark surface. The AI pillar uses the live
 * AgentConsole instead.
 */

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-px rounded-[17px] bg-gradient-to-br from-teal-bright via-plum-bright to-gold-bright"
      />
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1117] font-mono text-[13px] text-[#c9d1d9]">
        <div className="flex items-center gap-2 border-b border-[#21262d] px-4 py-3">
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span className="ml-2 text-[12px] tracking-[0.05em] text-on-dark-faint">{title}</span>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Bar({ label, pct, color, value }: { label: string; pct: number; color: string; value: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex justify-between text-[11.5px] tracking-[0.05em]">
        <span className="text-on-dark-muted">{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#21262d]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function UptimeCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; pct: number }[];
}) {
  const colors = ["#7ee787", "#4f93a6", "#c9a878"];
  return (
    <Frame title={title}>
      {rows.map((r, i) => (
        <Bar key={i} label={r.label} value={r.value} pct={r.pct} color={colors[i % colors.length]} />
      ))}
      <div className="mt-5 grid grid-cols-12 gap-1" aria-hidden>
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} className="h-2 rounded-sm" style={{ background: i === 22 ? "#c9a878" : "#1d3d29" }} />
        ))}
      </div>
    </Frame>
  );
}

export function AuditCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; status: "ok" | "progress" | "todo"; statusLabel: string }[];
}) {
  const style = {
    ok: { color: "#7ee787", glyph: "✓" },
    progress: { color: "#c9a878", glyph: "◐" },
    todo: { color: "#6d6580", glyph: "○" },
  };
  return (
    <Frame title={title}>
      <ul className="grid gap-3">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-4 border-b border-[#21262d] pb-3 last:border-0 last:pb-0">
            <span className="flex items-center gap-3">
              <span aria-hidden style={{ color: style[r.status].color }}>
                {style[r.status].glyph}
              </span>
              <span className="text-[#c9d1d9]">{r.label}</span>
            </span>
            <span className="text-[11px] tracking-[0.06em]" style={{ color: style[r.status].color }}>
              {r.statusLabel}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function CodeCard({ title }: { title: string }) {
  return (
    <Frame title={title}>
      <pre className="overflow-x-auto leading-[1.9]">
        <code>
          <span className="text-[#ff7b72]">from</span> <span className="text-[#c9d1d9]">fastapi</span>{" "}
          <span className="text-[#ff7b72]">import</span> <span className="text-[#c9d1d9]">FastAPI</span>
          {"\n\n"}
          <span className="text-[#c9d1d9]">app</span> <span className="text-[#ff7b72]">=</span>{" "}
          <span className="text-[#79c0ff]">FastAPI</span>
          <span className="text-[#c9d1d9]">()</span>
          {"\n\n"}
          <span className="text-[#8b949e]">@app.get</span>
          <span className="text-[#c9d1d9]">(</span>
          <span className="text-[#a5d6ff]">&quot;/orders/{"{order_id}"}&quot;</span>
          <span className="text-[#c9d1d9]">)</span>
          {"\n"}
          <span className="text-[#ff7b72]">async def</span> <span className="text-[#d2a8ff]">get_order</span>
          <span className="text-[#c9d1d9]">(order_id: </span>
          <span className="text-[#79c0ff]">int</span>
          <span className="text-[#c9d1d9]">):</span>
          {"\n"}
          <span className="text-[#c9d1d9]">    order </span>
          <span className="text-[#ff7b72]">=</span>
          <span className="text-[#ff7b72]"> await</span>
          <span className="text-[#c9d1d9]"> repo.get(order_id)</span>
          {"\n"}
          <span className="text-[#ff7b72]">    return</span>
          <span className="text-[#c9d1d9]"> order.to_dto()</span>
          {"\n\n"}
          <span className="text-[#8b949e]"># tests: 84 passed · coverage 96%</span>
        </code>
      </pre>
    </Frame>
  );
}

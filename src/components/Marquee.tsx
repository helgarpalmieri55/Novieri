export default function Marquee({ items, label }: { items: string[]; label: string }) {
  const Row = ({ hidden }: { hidden?: boolean }) => (
    <div
      aria-hidden={hidden}
      className="flex items-center gap-11 whitespace-nowrap pr-11 font-mono text-[13px] tracking-[0.08em] text-on-dark-muted"
    >
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-11">
          <span>{it}</span>
          <span aria-hidden className="text-gold-bright">
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div aria-label={label} className="dark-s relative overflow-hidden border-b border-line-dark py-4">
      <div aria-hidden className="seam absolute inset-x-0 top-0" />
      <div className="marquee-track flex w-max">
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}

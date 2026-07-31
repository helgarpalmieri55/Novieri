export default function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => (
        <details key={i} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-body font-medium marker:hidden [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden
              className="text-h3 font-normal leading-none text-plum transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="max-w-[68ch] pb-5 text-small text-ink-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

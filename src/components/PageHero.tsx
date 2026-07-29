/** Compact dark hero band for inner pages — the header always sits on black. */
export default function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="dark-s relative overflow-hidden pb-[clamp(3.5rem,8vh,5.5rem)] pt-[clamp(8.5rem,18vh,11rem)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 85% 90% at 70% 0%, #000 0%, transparent 68%)",
        }}
      />
      <div className="container-site relative">
        <span className="eyebrow rise">{eyebrow}</span>
        <h1 className="rise mt-5 max-w-[20ch]" style={{ ["--d" as string]: "100ms" }}>
          {title}
        </h1>
        {intro && (
          <p className="rise mt-6 max-w-[62ch] text-lg text-on-dark-muted" style={{ ["--d" as string]: "220ms" }}>
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

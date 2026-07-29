import { Link } from "@/i18n/navigation";

export default function CtaBand({
  title,
  subtitle,
  button,
}: {
  title: string;
  subtitle: string;
  button: string;
}) {
  return (
    <section className="dark-s relative overflow-hidden py-[clamp(6rem,16vh,10rem)]">
      <div aria-hidden className="seam absolute inset-x-0 top-0" />
      <div aria-hidden className="absolute -right-[70px] top-1/2 w-[460px] -translate-y-1/2 opacity-[0.16]">
        <svg viewBox="0 0 420 420" fill="none" className="spin-slower" style={{ transformOrigin: "50% 50%" }}>
          <path
            d="M210 20 C230 140 270 180 390 210 C270 240 230 280 210 400 C190 280 150 240 30 210 C150 180 190 140 210 20 Z"
            stroke="#c9a878"
            strokeWidth="1.5"
          />
          <path
            d="M210 90 C223 165 250 192 325 210 C250 228 223 255 210 330 C197 255 170 228 95 210 C170 192 197 165 210 90 Z"
            stroke="#8d63ad"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div className="container-site relative">
        <span aria-hidden className="font-sans text-[26px] font-bold tracking-[0.14em] text-gold-bright">
          ··
        </span>
        <h2 className="reveal mt-4 max-w-[18ch] text-[clamp(2.125rem,4.8vw,3.625rem)]">{title}</h2>
        <p className="reveal mt-4 max-w-[52ch] text-lg text-on-dark-muted" style={{ ["--rd" as string]: "80ms" }}>
          {subtitle}
        </p>
        <Link href="/contact" className="btn btn-white reveal mt-9" style={{ ["--rd" as string]: "160ms" }}>
          {button}
        </Link>
      </div>
    </section>
  );
}

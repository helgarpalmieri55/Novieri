import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// TODO before launch: set RESEND_API_KEY (and optionally CONTACT_EMAIL,
// RESEND_FROM) in the deployment environment.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@novieri.com";
const FROM = process.env.RESEND_FROM ?? "Novieri <onboarding@resend.dev>";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) return true;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Honeypot: bots fill it, humans never see it. Pretend success.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();
  const company = body.company?.trim() ?? "—";
  const service = body.service?.trim() ?? "—";
  const locale = body.locale === "en" ? "en" : "es";

  if (!name || !message || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (name.length > 200 || email.length > 320 || company.length > 200 || message.length > 5000) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("contact: RESEND_API_KEY is not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `[novieri.com] ${name} — ${service}`,
      html: `
        <h2 style="font-family:sans-serif">Nuevo mensaje del sitio (${locale})</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:4px 12px 4px 0"><b>Nombre</b></td><td>${esc(name)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0"><b>Empresa</b></td><td>${esc(company)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0"><b>Correo</b></td><td>${esc(email)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0"><b>Interés</b></td><td>${esc(service)}</td></tr>
        </table>
        <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${esc(message)}</p>
      `,
    });
    if (error) {
      console.error("contact: resend error", error);
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact: unexpected", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}

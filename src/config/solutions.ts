import type { SolutionKey } from "@/components/SolutionPageTemplate";

export const SOLUTIONS: { key: SolutionKey; href: string; accent: string }[] = [
  { key: "aiAssistant", href: "/solutions/ai-virtual-assistant", accent: "text-plum" },
  { key: "whatsapp", href: "/solutions/whatsapp-ai-assistant", accent: "text-teal" },
  { key: "itSuite", href: "/solutions/it-management-rmm", accent: "text-gold-deep" },
  { key: "monitoring", href: "/solutions/systems-monitoring", accent: "text-teal" },
  { key: "visitorIntel", href: "/solutions/visitor-intelligence", accent: "text-gold-deep" },
  { key: "sentinel", href: "/solutions/vulnerability-management", accent: "text-plum" },
  { key: "ventia", href: "/solutions/ventia", accent: "text-plum" },
  { key: "matterFlow", href: "/solutions/matter-flow", accent: "text-ink-muted" },
  { key: "webDev", href: "/solutions/ai-websites", accent: "text-teal" },
];

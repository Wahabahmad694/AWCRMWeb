import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChartNoAxesCombined, Check, Layers3, Settings2, Sparkles, UsersRound } from "lucide-react";

const sections = {
  customers: {
    title: "Customers", eyebrow: "BETTER CONNECTIONS", headline: "Great relationships.\nOne beautiful workspace.",
    description: "A fresh way to understand your customers, nurture every relationship, and keep the details that matter close at hand.",
    icon: UsersRound, accent: "blue", preview: "Customer workspace",
    features: [["A complete customer view", "Contact details, orders, and conversations together."], ["Smarter follow-ups", "Stay close to the people behind your business."], ["Relationships at a glance", "See customer history and balances in one place."]],
    existing: { href: "/customers/directory", label: "Open current customer directory" },
  },
  reports: {
    title: "Reports", eyebrow: "A CLEARER BIG PICTURE", headline: "Your numbers.\nA whole new perspective.",
    description: "A new reporting experience is on the way. Turn everyday business data into clear, useful insights you can act on.",
    icon: ChartNoAxesCombined, accent: "teal", preview: "Business intelligence",
    features: [["Beautiful visual reports", "Explore sales, collections, and business performance."], ["Find what drives growth", "Understand your products and customer trends."], ["Insights you can share", "Bring your team closer to the numbers that matter."]],
    existing: { href: "/reports/overview", label: "Open current reports" },
  },
  "ai-assistant": {
    title: "AI Assistant", eyebrow: "MEET YOUR NEXT ADVANTAGE", headline: "Less busywork.\nMore possibilities.",
    description: "Your future business copilot. We’re shaping a thoughtful AI experience to help you find answers and focus on your next move.",
    icon: Sparkles, accent: "violet", preview: "Your business copilot",
    features: [["Ask in your own words", "A simpler way to explore your business information."], ["Make sense of your day", "Bring important updates and priorities into focus."], ["Move forward with clarity", "Get helpful context for your next business decision."]],
    existing: null,
  },
  settings: {
    title: "Settings", eyebrow: "MAKE IT YOURS", headline: "Your business.\nYour way of working.",
    description: "A more intuitive home for your workspace preferences, with everything you need to shape a CRM that works for your team.",
    icon: Settings2, accent: "blue", preview: "Workspace preferences",
    features: [["A workspace that fits", "Manage your business identity and organization."], ["Stay in control", "Keep account and session settings within reach."], ["Your preferred updates", "Fine-tune the notifications that matter to you."]],
    existing: { href: "/settings/manage", label: "Open current workspace settings" },
  },
} as const;

export function ComingSoon({ section }: { section: keyof typeof sections }) {
  const content = sections[section];
  const Icon = content.icon;
  return <div className={`page-wrap coming-page accent-${content.accent}`}>
    <div className="page-heading"><div><div className="eyebrow">WORKSPACE / {content.title.toUpperCase()}</div><h1>{content.title}</h1><p>A little preview of what’s next for your business.</p></div><span className="release-badge"><span /> Coming soon</span></div>
    <section className="coming-hero">
      <div className="coming-copy"><span className="coming-icon"><Icon size={30} strokeWidth={1.6} /></span><div className="eyebrow">{content.eyebrow}</div><h2>{content.headline.split("\n").map(line => <span key={line}>{line}</span>)}</h2><p>{content.description}</p><div className="coming-actions"><Link href="/dashboard" className="primary-link"><ArrowLeft size={16} /> Back to dashboard</Link>{content.existing && <Link className="text-link" href={content.existing.href}>{content.existing.label}<ArrowUpRight size={16} /></Link>}</div><span className="coming-note"><Layers3 size={14} /> Thoughtfully designed. Currently in development.</span></div>
      <div className="preview-art" aria-hidden="true">
        <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
        <div className="preview-window"><div className="preview-window-bar"><span /><span /><span /><small>AW CRM</small></div><div className="preview-window-body"><div className="preview-label"><Icon size={20} /><strong>{content.preview}</strong><span>Preview</span></div><div className="preview-stats">{[0,1,2].map(i => <div key={i}><span /><strong /><small /></div>)}</div>{section === "ai-assistant" ? <div className="preview-chat"><span><Sparkles size={18} /> How can I help your business?</span><div /><div /><div /></div> : section === "reports" ? <div className="preview-bars">{[35,58,44,72,59,82,67,94,80,100].map((height,i) => <span key={i} style={{ height: `${height}%` }} />)}</div> : <div className="preview-rows">{[0,1,2].map(i => <div key={i}><i /><span /><small /><Check size={14} /></div>)}</div>}</div></div>
        <div className="preview-float"><span><Sparkles size={18} /></span><div><strong>Something good is coming</strong><small>Built around your business</small></div></div>
      </div>
    </section>
    <div className="upcoming-heading"><div><span className="eyebrow">LOOKING AHEAD</span><h2>A glimpse of what’s planned</h2></div><span>Designed to make your everyday easier</span></div>
    <div className="upcoming-grid">{content.features.map(([title, description], index) => <article className="upcoming-card" key={title}><span className="feature-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
  </div>;
}

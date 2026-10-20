import { ChartNoAxesCombined, CircleCheck, Layers3, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

export function AuthShell({ title, description, eyebrow = "WELCOME TO A.W CRM", children, footer }: { title: string; description: string; eyebrow?: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className={styles.screen}>
      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />
      <div className={styles.brand} aria-label="A.W CRM">
        <span className={styles.brandMark}><Layers3 size={19} strokeWidth={2.2} /></span>
        <span>A.W <strong>CRM</strong></span>
      </div>

      <div className={styles.layout}>
        <section className={styles.story} aria-label="Your business workspace">
          <div className={styles.storyGrid} aria-hidden="true" />
          <div className={styles.storyContent}>
            <span className={styles.storyBadge}><Sparkles size={13} aria-hidden="true" /> YOUR BUSINESS, IN FOCUS</span>
            <h2>Everything you need to <em>move forward.</em></h2>
            <p>Customers, sales, inventory, and insights — together in one place.</p>
            <div className={styles.preview} aria-hidden="true">
              <div className={styles.previewTop}><span><i /><i /><i /></span><span className={styles.previewLine} /></div>
              <div className={styles.previewBody}>
                <div className={styles.previewHeading}><span><ChartNoAxesCombined size={17} /> Business overview</span><span className={styles.previewPill}>This month</span></div>
                <div className={styles.previewCards}><span><small>Revenue</small><strong>Sales insights</strong></span><span><small>Orders</small><strong>All in one place</strong></span></div>
                <div className={styles.chart}><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
              </div>
            </div>
          </div>
          <div className={styles.storyFoot}><CircleCheck size={15} aria-hidden="true" /> Built for a clearer way to work</div>
        </section>

        <section className={styles.formPanel} aria-labelledby="login-title">
          <div className={styles.formIntro}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1 id="login-title">{title}</h1>
            <p>{description}</p>
          </div>
          {children}
          <div className={styles.links}>{footer}</div>
          <p className={styles.formFoot}>Secure access to your workspace</p>
        </section>
      </div>
      <p className={styles.pageFoot}>A.W CRM · Your business, beautifully connected</p>
    </main>
  );
}

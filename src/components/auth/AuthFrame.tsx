import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { BRANDING } from '../../config/appContent';

export function AuthFrame({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-workspace">
      <div className="auth-brand">
        <img src="/medpos.png" alt="" />
        <span>{BRANDING.productName}</span>
      </div>
      <section className="auth-frame">
        <span className="text-xs font-semibold text-primary">Your pharmacy workspace</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </section>
      <footer className="auth-footer">
        <span>Medical POS</span>
        <span><ShieldCheck size={14} aria-hidden /> Secure account access</span>
      </footer>
    </main>
  );
}

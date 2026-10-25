import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Boxes,
  Moon,
  ReceiptText,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { BRANDING } from "../../config/appContent";
import { useTheme } from "../../hooks/useTheme";
import "../../styles/login.css";

function PharmacyEmblem() {
  return (
    <div className="login-emblem" aria-hidden="true">
      <div className="login-orbit login-orbit-outer" />
      <div className="login-orbit login-orbit-inner" />
      <div className="login-orbit-dot" />
      <svg className="login-cross" viewBox="0 0 360 320" fill="none">
        <defs>
          <linearGradient
            id="cross-face"
            x1="95"
            y1="50"
            x2="275"
            y2="290"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F1F5FF" />
            <stop offset="0.42" stopColor="#C8D9FF" />
            <stop offset="1" stopColor="#738FDF" />
          </linearGradient>
          <linearGradient
            id="cross-edge"
            x1="120"
            y1="80"
            x2="240"
            y2="280"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#93ACEB" />
            <stop offset="1" stopColor="#3C58A3" />
          </linearGradient>
        </defs>
        <g transform="rotate(-14 180 160)">
          <path
            d="M153 47H207Q218 47 218 58V122H282Q293 122 293 133V187Q293 198 282 198H218V262Q218 273 207 273H153Q142 273 142 262V198H78Q67 198 67 187V133Q67 122 78 122H142V58Q142 47 153 47Z"
            fill="url(#cross-edge)"
            transform="translate(0 12)"
          />
          <path
            d="M153 47H207Q218 47 218 58V122H282Q293 122 293 133V187Q293 198 282 198H218V262Q218 273 207 273H153Q142 273 142 262V198H78Q67 198 67 187V133Q67 122 78 122H142V58Q142 47 153 47Z"
            fill="url(#cross-face)"
            stroke="#EEF3FF"
            strokeOpacity="0.65"
          />
          <path
            d="M154 53H205M73 135V184M154 267H205"
            stroke="white"
            strokeOpacity="0.65"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="login-art-label login-art-billing">
        <span>
          <ReceiptText size={17} />
        </span>
        <div>
          Seamless billing<small>Every checkout, simplified</small>
        </div>
      </div>
      <div className="login-art-label login-art-inventory">
        <span>
          <Boxes size={17} />
        </span>
        <div>
          Smarter inventory<small>A clearer view of your stock</small>
        </div>
      </div>
    </div>
  );
}

export function LoginExperience({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <main className="login-workspace">
      <section className="login-story" aria-label="MedPOS pharmacy workspace">
        <div className="login-brand">
          <span className="login-brand-mark" aria-hidden="true">
            ✚
          </span>
          <span>
            {BRANDING.shortProductName}
            <span className="login-pro">PRO</span>
          </span>
        </div>
        <div className="login-story-content">
          <span className="login-eyebrow">
            <span /> BUILT FOR THE WAY YOU CARE
          </span>
          <h1>
            Your pharmacy.
            <br />
            <span>A little more</span>
            <br />
            effortless.
          </h1>
          <p>
            Less time managing. More time caring.
            <br />
            Bring your everyday work into one beautiful space.
          </p>
          <PharmacyEmblem />
        </div>
        <div className="login-story-footer">
          <span>BILLING. INVENTORY. PEACE OF MIND.</span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </div>
      </section>

      <section className="login-entry" aria-labelledby="login-heading">
        <div className="login-entry-top">
          <span>
            <ShieldCheck size={15} aria-hidden="true" /> Secure workspace
          </span>
          <button
            type="button"
            className="login-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="login-form-wrap">
          <div className="login-welcome-mark" aria-hidden="true">
            <span>✚</span>
          </div>
          <span className="login-form-eyebrow">YOUR DAILY DOSE OF CLARITY</span>
          <h2 id="login-heading">Welcome back.</h2>
          <p className="login-description">
            Your pharmacy is in good hands.
            <br />
            Sign in and pick up where you left off.
          </p>
          {children}
        </div>
        <footer className="login-entry-footer">
          <ShieldCheck size={15} aria-hidden="true" />
          <span>A little more confidence, every day.</span>
          <span className="login-footer-brand">
            {BRANDING.shortProductName} Pro
          </span>
        </footer>
      </section>
    </main>
  );
}

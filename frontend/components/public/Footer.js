// Site footer shown on all public pages. Dark olive background with gold accents,
// matching the design. Brand blurb + social icons + link columns.

import Link from "next/link";
import { Home } from "lucide-react";
import { GOLD, OLIVE } from "./palette";

// Brand glyphs as inline SVGs (lucide-react no longer ships brand icons).
const Svg = ({ children }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,.52)" aria-hidden>{children}</svg>
);
const Instagram = () => <Svg><path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.12.32-.27.8-.31 1.7C3.21 8.5 3.2 8.85 3.2 12s.01 3.5.07 4.74c.04.9.19 1.38.31 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.12.8.27 1.7.31 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.38-.19 1.7-.31.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.12-.32.27-.8.31-1.7.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.38-.31-1.7a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.12-.8-.27-1.7-.31C15.5 4.01 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 17a4.94 4.94 0 0 1 0-9.94Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-.9a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" /></Svg>;
const Linkedin = () => <Svg><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.64h.05c.53-1 1.83-2.06 3.76-2.06C20.6 8.58 22 10.2 22 13.5V21h-4v-6.66c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.73-2.56 3.52V21H9V9Z" /></Svg>;
const Facebook = () => <Svg><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" /></Svg>;
const Twitter = () => <Svg><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.46l7.73-8.84L1.04 2.25H7.9l4.71 6.23 5.63-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z" /></Svg>;

const SOCIALS = [
  { I: Instagram, href: "/#" },
  { I: Linkedin, href: "/#" },
  { I: Facebook, href: "/#" },
  { I: Twitter, href: "/#" },
];

const COLS = [
  { t: "Explore", ls: [
    { label: "Browse Listings", href: "/properties" },
    { label: "Find Roommates", href: "/roommates" },
    { label: "For Owners", href: "/owner" },
    { label: "All Cities", href: "/properties" },
  ] },
  { t: "Company", ls: [
    { label: "About Us", href: "/#" },
    { label: "Blog", href: "/#" },
    { label: "Careers", href: "/#" },
    { label: "Contact Us", href: "/#" },
  ] },
  { t: "Support", ls: [
    { label: "Help Center", href: "/#" },
    { label: "Safety Tips", href: "/#" },
    { label: "Community", href: "/#" },
    { label: "Report Issue", href: "/#" },
  ] },
  { t: "Legal", ls: [
    { label: "Privacy Policy", href: "/#" },
    { label: "Terms of Service", href: "/#" },
    { label: "Cookie Policy", href: "/#" },
    { label: "Sitemap", href: "/#" },
  ] },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto py-16 px-6" style={{ background: OLIVE }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GOLD }}>
                <Home size={14} color={OLIVE} />
              </span>
              <span className="font-bold text-lg text-white">StayMate</span>
            </div>
            <p className="text-xs leading-relaxed mb-5 max-w-xs" style={{ color: "rgba(255,255,255,.38)" }}>
              Kerala&apos;s most trusted platform for finding rooms, PGs, apartments and compatible roommates. Zero brokerage, 100% verified.
            </p>
            <div className="flex gap-2.5">
              {SOCIALS.map(({ I: Icon, href }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.10)" }}
                >
                  <Icon />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.t}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.t}</h4>
              <ul className="space-y-2.5">
                {col.ls.map((l, idx) => (
                  <li key={idx}>
                    <Link href={l.href} className="text-xs transition-colors duration-200 hover:text-white" style={{ color: "rgba(255,255,255,.38)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,.28)" }}>© StayMate {year}. All rights reserved.</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,.28)" }}>Made with ❤️ in Kerala</p>
        </div>
      </div>
    </footer>
  );
}

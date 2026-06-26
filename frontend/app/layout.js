import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

// Brand typography (matches the design): Inter for body text, DM Sans for
// headings. Both are exposed as CSS variables and wired up in globals.css.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Site-wide SEO defaults. Individual pages can override title/description.
// This is one of the big reasons we use Next.js: clean, server-rendered SEO.
export const metadata = {
  title: {
    default: "StayMate — Find your next stay, roommate, or rental space",
    template: "%s | StayMate",
  },
  description:
    "StayMate helps you find rooms, PGs, apartments and roommates in minutes. Browse verified listings, chat with owners, and move in faster.",
  keywords: ["rooms for rent", "PG", "roommates", "apartments", "rental", "StayMate"],
  openGraph: {
    title: "StayMate — Find your next stay, roommate, or rental space",
    description:
      "Browse verified rooms, PGs and apartments. Chat with owners and move in faster.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

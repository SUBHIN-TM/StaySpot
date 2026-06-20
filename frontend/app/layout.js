import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

// Load the Geist font and expose it as a CSS variable (used in globals.css).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

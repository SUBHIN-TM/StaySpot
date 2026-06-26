// Sage band with an infinite scrolling strip of category pills — adds motion and
// quickly tells visitors what kinds of stays they'll find. Purely decorative.

import {
  Tag, Bed, Home, Building2, Users, MapPin, Layers, LayoutGrid,
  DoorOpen, Star, Train, PawPrint, Shield, User, School,
} from "lucide-react";
import { SAGE } from "./palette";

const CATS = [
  { I: Tag, l: "Budget Friendly" }, { I: Bed, l: "Single Rooms" },
  { I: Home, l: "Rentals" }, { I: Building2, l: "Hostels" },
  { I: Users, l: "Co-Living" }, { I: MapPin, l: "Bengaluru" },
  { I: MapPin, l: "Kochi" }, { I: Layers, l: "Studios" },
  { I: Building2, l: "Apartments" }, { I: LayoutGrid, l: "Shared Flats" },
  { I: DoorOpen, l: "PG" }, { I: Home, l: "Family Homes" },
  { I: Star, l: "Luxury" }, { I: Train, l: "Near Metro" },
  { I: PawPrint, l: "Pet Friendly" }, { I: Shield, l: "Women's Hostel" },
  { I: User, l: "Men's Hostel" }, { I: School, l: "Student Housing" },
];

export default function Marquee() {
  // Duplicate the list so the -50% scroll loops seamlessly.
  const loop = [...CATS, ...CATS];

  return (
    <section className="py-8 overflow-hidden" style={{ background: SAGE }}>
      <div className="marquee-fast flex gap-3 w-max">
        {loop.map((c, i) => {
          const Icon = c.I;
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer flex-shrink-0 hover:scale-105 transition-transform duration-200"
              style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.88)" }}
            >
              <Icon size={13} />
              {c.l}
            </div>
          );
        })}
      </div>
    </section>
  );
}

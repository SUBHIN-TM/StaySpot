// Shared option lists + labels for property amenities and policies.
// Used by the owner form (input), the property detail page and the card (display)
// so the labels stay consistent everywhere. Values are the snake_case strings
// stored in the DB (see migration 018); labels are what users see.

import {
  Wifi, Snowflake, Zap, Droplets, Flame, ShowerHead, Car, Utensils,
  WashingMachine, Cctv, ArrowUpDown, Refrigerator, Sparkles, Shirt, Lamp,
  Dumbbell, Sun, Sofa, Tag,
} from "lucide-react";

// Multi-select amenities checklist (recommended + optional, all opt-in).
export const AMENITIES = [
  { value: "wifi", label: "Free WiFi" },
  { value: "ac", label: "Air conditioning" },
  { value: "power_backup", label: "Power backup" },
  { value: "water_247", label: "24×7 water" },
  { value: "hot_water", label: "Hot water / geyser" },
  { value: "attached_bathroom", label: "Attached bathroom" },
  { value: "parking", label: "Parking" },
  { value: "kitchen", label: "Kitchen access" },
  { value: "washing_machine", label: "Washing machine" },
  { value: "cctv", label: "CCTV / security" },
  { value: "lift", label: "Lift" },
  { value: "refrigerator", label: "Refrigerator" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "wardrobe", label: "Wardrobe" },
  { value: "study_table", label: "Study table" },
  { value: "gym", label: "Gym" },
  { value: "balcony", label: "Balcony" },
];

// Single-select policies / furnishing.
export const FURNISHING = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "fully_furnished", label: "Fully furnished" },
];
export const PETS = [
  { value: "allowed", label: "Pets allowed" },
  { value: "not_allowed", label: "Pets not allowed" },
];
export const ELECTRICITY = [
  { value: "included", label: "Electricity included in rent" },
  { value: "separate", label: "Electricity billed separately" },
];
export const PREFERRED_TENANT = [
  { value: "family", label: "Family" },
  { value: "bachelors", label: "Bachelors" },
  { value: "students", label: "Students" },
  { value: "professionals", label: "Working professionals" },
  { value: "girls", label: "Girls only" },
  { value: "boys", label: "Boys only" },
];
export const FOOD = [
  { value: "included", label: "Food included" },
  { value: "not_included", label: "Food not included" },
];

// Icon per amenity (lucide-react components) so chips can show an icon + label.
// Fall back to a generic Tag for anything unmapped.
export const AMENITY_FALLBACK_ICON = Tag;
export const AMENITY_ICON = {
  wifi: Wifi,
  ac: Snowflake,
  power_backup: Zap,
  water_247: Droplets,
  hot_water: Flame,
  attached_bathroom: ShowerHead,
  parking: Car,
  kitchen: Utensils,
  washing_machine: WashingMachine,
  cctv: Cctv,
  lift: ArrowUpDown,
  refrigerator: Refrigerator,
  housekeeping: Sparkles,
  wardrobe: Shirt,
  study_table: Lamp,
  gym: Dumbbell,
  balcony: Sun,
};

// Furnishing shown as a chip too (short label + a sofa icon).
export const FURNISHING_ICON = Sofa;
export const FURNISHING_SHORT = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-furnished",
  fully_furnished: "Furnished",
};

// value → label lookups for displaying a stored value.
const toMap = (list) => Object.fromEntries(list.map((o) => [o.value, o.label]));
export const AMENITY_LABEL = toMap(AMENITIES);
export const FURNISHING_LABEL = toMap(FURNISHING);
export const PETS_LABEL = toMap(PETS);
export const ELECTRICITY_LABEL = toMap(ELECTRICITY);
export const PREFERRED_TENANT_LABEL = toMap(PREFERRED_TENANT);
export const FOOD_LABEL = toMap(FOOD);

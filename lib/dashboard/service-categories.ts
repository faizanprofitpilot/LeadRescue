export const SERVICE_CATEGORIES = [
  "hvac",
  "plumbing",
  "roofing",
  "electrical",
  "garage_door",
  "pest_control",
  "landscaping",
  "cleaning",
  "restoration",
  "handyman",
  "appliance_repair",
  "other",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hvac: "HVAC",
  plumbing: "Plumbing",
  roofing: "Roofing",
  electrical: "Electrical",
  garage_door: "Garage door",
  pest_control: "Pest control",
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  restoration: "Restoration",
  handyman: "Handyman",
  appliance_repair: "Appliance repair",
  other: "Other home service",
};

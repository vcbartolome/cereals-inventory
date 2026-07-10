import { z } from "zod";

// Shared options for inventory form
export const typeOptions = [
  "white",
  "yellow",
  "sorghum",
  "special maize",
] as const;
export const locationOptions = ["LBTR", "LBPD", "CMU", "Others"] as const;
export const seasonOptions = ["wet", "dry", "N/A"] as const;

// Zod schema for the inventory form
export const inventoryFormSchema = z.object({
  type: z.enum(typeOptions).optional(), 
  area_planted: z.string().optional(),
  year: z.string().optional(),
  season: z.enum(seasonOptions).optional(),
  box_number: z.number().int().gte(0, { message: "Required" }),
  location: z.enum(locationOptions).optional(),
  shelf_code: z.string().optional(),
  description: z.string().optional(),
  pedigree: z.string().trim().optional(),
  weight: z.number().optional(),
  remarks: z.string().optional(),
  id: z.string().optional(),
  addedAt: z
    .object({
      seconds: z.number(),
      nanoseconds: z.number(),
    })
    .optional(),
  addedBy: z.string().optional(),
  creatorId: z.string().optional(),
});

// Type alias for form values
export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

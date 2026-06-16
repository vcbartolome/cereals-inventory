"use client";

import { InventoryFormValues } from "@/lib/schemas/inventory";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<InventoryFormValues>[] = [
  {
    id: "box_number",
    accessorKey: "box_number",
    header: "Box Number",
    enableSorting: true,
  },
  {
    id: "shelf_code",
    accessorKey: "shelf_code",
    header: "Shelf Code",
    enableSorting: true,
  },
  {
    id: "year",
    accessorKey: "year",
    header: "Year(s)",
    enableSorting: true,
  },
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    enableSorting: true,
  },
  {
    id: "season",
    accessorKey: "season",
    header: "Season",
    enableSorting: true,
  },
  {
    id: "pedigree",
    accessorKey: "pedigree",
    header: "Pedigree",
    enableSorting: true,
  },
  {
    id: "weight",
    accessorKey: "weight",
    header: "Weight (kg)",
    enableSorting: true,
  },
  {
    id: "area_planted",
    accessorKey: "area_planted",
    header: "Area Planted",
    enableSorting: true,
  },
  {
    id: "location",
    accessorKey: "location",
    header: "Location",
    enableSorting: true,
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    enableSorting: true,
  },
  {
    id: "remarks",
    accessorKey: "remarks",
    header: "Remarks",
    enableSorting: true,
  },
];

"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InventoryFormValues } from "@/backend/schemas/inventory";

interface TotalWeightCardProps {
  data: InventoryFormValues[];
}

export function TotalWeightCard({ data }: TotalWeightCardProps) {
  const totalWeight = useMemo(
    () => data.reduce((sum, item) => sum + (item.weight || 0), 0),
    [data],
  );

  return (
    <Card className="h-75 flex flex-col">
      <CardHeader>
        <CardTitle>Total Weight</CardTitle>
        <CardDescription>Total weight of all inventory items</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center flex-1">
        <p className="text-3xl font-bold">{totalWeight.toFixed(2)} kg</p>
      </CardContent>
    </Card>
  );
}


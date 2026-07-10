"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryFormValues } from "@/lib/schemas/inventory";

interface LowStockCardProps {
  data: InventoryFormValues[];
}

export function LowStockCard({ data }: LowStockCardProps) {
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(2);
  const [lowStockSortBy, setLowStockSortBy] = useState<string>("weight");
  const [lowStockDisplayCount, setLowStockDisplayCount] = useState<number>(5);

  // Calculate low stock items
  const lowStockItems = useMemo(() => {
    // Filter items based on threshold and exclude zero weight unless threshold is 0
    const filteredItems = data.filter((item) => {
      const weight = item.weight || 0;
      if (lowStockThreshold === 0) {
        return weight <= lowStockThreshold;
      } else {
        return weight > 0 && weight < lowStockThreshold;
      }
    });

    // Sort items based on selected sort option
    return filteredItems.sort((a, b) => {
      if (lowStockSortBy === "weight") {
        return (a.weight || 0) - (b.weight || 0); // Ascending weight
      } else {
        return Number(a.box_number || 0) - Number(b.box_number || 0); // Ascending box number
      }
    });
  }, [data, lowStockThreshold, lowStockSortBy]);

  // Reset display count when filters change
  useEffect(() => {
    setLowStockDisplayCount(5);
  }, [lowStockThreshold, lowStockSortBy]);

  return (
    <Card className="h-75">
      <CardHeader>
        <CardTitle>Low Stocks</CardTitle>
        <CardDescription>Items with weight below threshold</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lowStockItems.length === 0 ? (
            <>
            <div className="text-sm text-gray-600">
              All items are well stocked!
            </div>
            <div className="flex items-center justify-between mt-4 gap-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Threshold:</span>
                  <Select
                    value={"0"}
                    onValueChange={(value) =>
                      setLowStockThreshold(Number(value))
                    }
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 kg</SelectItem>
                      <SelectItem value="1">1 kg</SelectItem>
                      <SelectItem value="0.5">0.5 kg</SelectItem>
                      <SelectItem value="0">0 kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sort:</span>
                  <Select
                    value={lowStockSortBy}
                    onValueChange={setLowStockSortBy}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="box_number">Box #</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            
            </>
          
          ) : (
            <>
              <div className="max-h-32 overflow-y-auto">
                {lowStockItems
                  .slice(0, lowStockDisplayCount)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-1 px-2 bg-red-50 rounded mb-1"
                    >
                      <span className="text-xs truncate">
                        {item.type || "Unknown"} - Box{" "}
                        {item.box_number || "N/A"}
                      </span>
                      <span className="text-xs font-medium text-red-600">
                        {(item.weight || 0).toFixed(3)}kg
                      </span>
                    </div>
                  ))}
                {lowStockItems.length > lowStockDisplayCount && (
                  <button
                    onClick={() =>
                      setLowStockDisplayCount((prev) =>
                        Math.min(prev + 10, lowStockItems.length),
                      )
                    }
                    className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer mt-1"
                  >
                    ...and {lowStockItems.length - lowStockDisplayCount} more
                    items
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 gap-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Threshold:</span>
                  <Select
                    value={lowStockThreshold.toString()}
                    onValueChange={(value) =>
                      setLowStockThreshold(Number(value))
                    }
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 kg</SelectItem>
                      <SelectItem value="1">1 kg</SelectItem>
                      <SelectItem value="0.5">0.5 kg</SelectItem>
                      <SelectItem value="0">0 kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sort:</span>
                  <Select
                    value={lowStockSortBy}
                    onValueChange={setLowStockSortBy}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="box_number">Box #</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

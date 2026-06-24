"use client";

import { useState, useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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
import type { InventoryFormValues } from "@/backend/schemas/inventory";

interface WeightDistributionCardProps {
  data: InventoryFormValues[];
}

export function WeightDistributionCard({ data }: WeightDistributionCardProps) {
  const [binSize, setBinSize] = useState<string>("1");
  const [filterType, setFilterType] = useState<string>("all");

  const { chartData, stats, typeOptions } = useMemo(() => {
    if (!data.length) return { chartData: [], stats: null, typeOptions: [] };

    // Get unique types for filter
    const types = [
      ...new Set(
        data
          .map((item) => item.type)
          .filter(
            (type): type is Exclude<InventoryFormValues["type"], undefined> =>
              Boolean(type),
          ),
      ),
    ].sort();

    // Filter data by type
    const filteredData =
      filterType === "all"
        ? data
        : data.filter((item) => item.type === filterType);

    // Extract weights and calculate statistics
    const weights = filteredData
      .map((item) => item.weight || 0)
      .filter((w) => w > 0);

    if (weights.length === 0) {
      return { chartData: [], stats: null, typeOptions: types };
    }

    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;

    // Sort weights for median calculation (don't mutate original array)
    const sortedWeights = [...weights].sort((a, b) => a - b);
    const medianWeight = sortedWeights[Math.floor(sortedWeights.length / 2)];

    // Calculate standard deviation
    const variance =
      weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) /
      weights.length;
    const stdDev = Math.sqrt(variance);

    const stats = {
      count: weights.length,
      min: minWeight,
      max: maxWeight,
      avg: avgWeight,
      median: medianWeight,
      stdDev: stdDev,
      range: maxWeight - minWeight,
    };

    // Create histogram bins
    const binSizeNum = parseFloat(binSize);
    const numBins = Math.ceil((maxWeight - minWeight) / binSizeNum);
    const bins: { range: string; count: number; percentage: number }[] = [];

    for (let i = 0; i < numBins; i++) {
      const binStart = minWeight + i * binSizeNum;
      const binEnd = binStart + binSizeNum;
      const count = weights.filter(
        (w) => w >= binStart && (i === numBins - 1 ? w <= binEnd : w < binEnd),
      ).length;
      const percentage = (count / weights.length) * 100;

      bins.push({
        range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        percentage: Number(percentage.toFixed(1)),
      });
    }

    return { chartData: bins, stats, typeOptions: types };
  }, [data, binSize, filterType]);

  return (
    <Card className="min-w-96 h-80">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <CardTitle>Weight Distribution</CardTitle>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
          <Select value={binSize} onValueChange={setBinSize}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Bin size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5 kg</SelectItem>
              <SelectItem value="1">1 kg</SelectItem>
              <SelectItem value="2">2 kg</SelectItem>
              <SelectItem value="5">5 kg</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {typeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            {/* Chart */}
            {chartData.length > 0 ? (
              <div>
                <ChartContainer
                  className="h-60"
                  config={{
                    count: {
                      label: "Number of Items",
                      color: "#8884d8",
                    },
                  }}
                >
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="range"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => {
                        const dataPoint = chartData.find(
                          (d) => d.count === value,
                        );
                        return [
                          `${value} items (${dataPoint?.percentage || 0}%)`,
                          "Count",
                        ];
                      }}
                    />
                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available for the selected filter
              </div>
            )}
          </div>
          {/* Statistics */}
          {stats && (
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="bg-blue-50 p-1 rounded">
                <div className="font-semibold text-blue-900">Average</div>
                <div className="text-blue-700">{stats.avg.toFixed(2)} kg</div>
              </div>
              <div className="bg-green-50 p-1 rounded">
                <div className="font-semibold text-green-900">Median</div>
                <div className="text-green-700">
                  {stats.median.toFixed(2)} kg
                </div>
              </div>
              <div className="bg-orange-50 p-1 rounded">
                <div className="font-semibold text-orange-900">Range</div>
                <div className="text-orange-700">
                  {stats.min.toFixed(1)} - {stats.max.toFixed(1)} kg
                </div>
              </div>
              <div className="bg-purple-50 p-1 rounded">
                <div className="font-semibold text-purple-900">Std Dev</div>
                <div className="text-purple-700">
                  {stats.stdDev.toFixed(2)} kg
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


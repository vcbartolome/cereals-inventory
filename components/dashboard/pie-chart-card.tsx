"use client";

import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryFormValues } from "@/lib/schemas/inventory";

interface PieChartCardProps {
  data: InventoryFormValues[];
  selectedChart: string;
  onChartChange: (chart: string) => void;
  chartWeightMode: boolean;
  onWeightModeChange: (weightMode: boolean) => void;
}

// Color palette for charts
const colors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#87ceeb",
  "#deb887",
  "#f0e68c",
  "#ff6347",
  "#40e0d0",
  "#ee82ee",
  "#90ee90",
  "#ffa07a",
];

// Chart options for dropdown
const chartOptions = [
  {
    value: "type",
    label: "Type",
    description: "Distribution by cereal type",
  },
  { value: "season", label: "Season", description: "Distribution by season" },
  {
    value: "location",
    label: "Location",
    description: "Distribution by storage location",
  },
];

export function PieChartCard({
  data,
  selectedChart,
  onChartChange,
  chartWeightMode,
  onWeightModeChange,
}: PieChartCardProps) {
  // Chart data calculations
  const chartData = useMemo(() => {
    if (!data.length) return {};

    // Helper function to create chart data from field counts
    const createChartData = (field: keyof InventoryFormValues) => {
      const counts: Record<string, number> = {};
      const weights: Record<string, number> = {};

      data.forEach((item) => {
        const value = String(item[field] || "Unknown");
        counts[value] = (counts[value] || 0) + 1;
        weights[value] = (weights[value] || 0) + (item.weight || 0);
      });

      const dataToUse = chartWeightMode ? weights : counts;

      return Object.entries(dataToUse).map(([name, value], index) => ({
        name,
        value,
        fill: colors[index % colors.length],
      }));
    };

    return {
      type: createChartData("type"),
      season: createChartData("season"),
      location: createChartData("location")
    };
  }, [data, chartWeightMode]);

  const currentChartData =
    chartData[selectedChart as keyof typeof chartData] || [];

  return (
    <Card className="w-100 h-75">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Charts</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <div>
              <Select value={selectedChart} onValueChange={onChartChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chart" />
                </SelectTrigger>
                <SelectContent>
                  {chartOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={chartWeightMode ? "weight" : "count"}
                onValueChange={(value) =>
                  onWeightModeChange(value === "weight")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count"># of entries</SelectItem>
                  <SelectItem value="weight">Weight (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={currentChartData.reduce(
            (acc, item) => ({
              ...acc,
              [item.name]: { label: item.name, color: item.fill },
            }),
            {},
          )}
        >
          <PieChart>
            <Pie
              data={currentChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {currentChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent className="w-auto min-w-max" />}
              formatter={(value) => [
                `${chartWeightMode ? Number(value).toFixed(2) : value}${chartWeightMode ? " kg" : " entries"}`,
              ]}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
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

interface ComparativeAnalysisCardProps {
  data: InventoryFormValues[];
}

export function ComparativeAnalysisCard({
  data,
}: ComparativeAnalysisCardProps) {
  const [comparisonType, setComparisonType] = useState<string>("yearly");
  const [metric, setMetric] = useState<string>("weight");

  const { chartData, growthData } = useMemo(() => {
    if (!data.length) return { chartData: [], growthData: [], insights: null };

    let groupedData: Record<
      string,
      { count: number; weight: number; items: InventoryFormValues[] }
    > = {};
    let sortedKeys: string[] = [];

    // Group data based on comparison type
    switch (comparisonType) {
      case "yearly":
        data.forEach((item) => {
          const key = item.year || "Unknown";
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;

      case "seasonal":
        data.forEach((item) => {
          const key = `${item.year || "Unknown"}-${item.season || "unknown"}`;
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;

      case "type":
        data.forEach((item) => {
          const key = item.type || "Unknown";
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;

      case "location":
        data.forEach((item) => {
          const key = item.area_planted || "Unknown";
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;
    }

    // Prepare chart data
    const chartData = sortedKeys.map((key) => {
      const data = groupedData[key];
      return {
        period: key,
        count: data.count,
        weight: Number(data.weight.toFixed(2)),
        avgWeight:
          data.count > 0 ? Number((data.weight / data.count).toFixed(2)) : 0,
        totalItems: data.count,
      };
    });

    // Calculate growth data (only for time-based comparisons)
    const growthData =
      comparisonType === "yearly" || comparisonType === "seasonal"
        ? chartData.map((item, index) => {
            if (index === 0) return { ...item, growth: 0, weightGrowth: 0 };

            const prev = chartData[index - 1];
            const countGrowth =
              prev.count > 0
                ? ((item.count - prev.count) / prev.count) * 100
                : 0;
            const weightGrowth =
              prev.weight > 0
                ? ((item.weight - prev.weight) / prev.weight) * 100
                : 0;

            return {
              ...item,
              growth: Number(countGrowth.toFixed(1)),
              weightGrowth: Number(weightGrowth.toFixed(1)),
            };
          })
        : [];

    return { chartData, growthData };
  }, [data, comparisonType, metric]);

  const getYAxisLabel = () => {
    switch (metric) {
      case "count":
        return "Number of Items";
      case "weight":
        return "Total Weight (kg)";
      case "avgWeight":
        return "Average Weight (kg)";
      default:
        return "Total Weight (kg)";
    }
  };

  const getXAxisLabel = () => {
    switch (comparisonType) {
      case "yearly":
        return "Year";
      case "seasonal":
        return "Year-Season";
      case "type":
        return "Type";
      case "location":
        return "Location";
      default:
        return "Period";
    }
  };

  const formatPeriod = (period: string) => {
    if (comparisonType === "seasonal") {
      return period.replace("-", " ");
    }
    return period;
  };

  return (
    <Card className="h-80 w-110">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Comparative Analysis</CardTitle>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={comparisonType} onValueChange={setComparisonType}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Compare by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Year</SelectItem>
                <SelectItem value="seasonal">Season</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">Total Weight</SelectItem>
                <SelectItem value="count">Item Count</SelectItem>
                <SelectItem value="avgWeight">Avg Weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          {chartData.length > 0 ? (
            <ChartContainer
              className="h-50"
              config={{
                [metric]: {
                  label: getYAxisLabel(),
                  color: "#8884d8",
                },
              }}
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  fontSize={12}
                  angle={comparisonType === "seasonal" ? -45 : 0}
                  textAnchor={comparisonType === "seasonal" ? "end" : "middle"}
                  height={comparisonType === "seasonal" ? 60 : 30}
                  tickFormatter={formatPeriod}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for comparison
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


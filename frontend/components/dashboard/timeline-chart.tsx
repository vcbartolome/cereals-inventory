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

interface TimelineChartProps {
  data: InventoryFormValues[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  const [timelineMode, setTimelineMode] = useState<string>("month");

  const timelineData = useMemo(() => {
    if (!data.length) return [];

    // Group entries by time period
    const timeGroups: Record<string, number> = {};

    data.forEach((item) => {
      if (!item.addedAt) return;

      // Convert Firebase timestamp to Date
      const date = new Date(item.addedAt.seconds * 1000);

      let key: string;
      switch (timelineMode) {
        case "day":
          key = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "year":
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      timeGroups[key] = (timeGroups[key] || 0) + 1;
    });

    // Convert to array and sort by date
    return Object.entries(timeGroups)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [data, timelineMode]);

  const formatXAxisLabel = (period: string) => {
    switch (timelineMode) {
      case "day":
        return new Date(period).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "week":
        return new Date(period).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "month":
        const [year, month] = period.split("-");
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
          },
        );
      case "year":
        return period;
      default:
        return period;
    }
  };

  return (
    <Card className="w-130 h-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Entry Additions Timeline</CardTitle>
            <CardDescription>
              Track when inventory entries were added
            </CardDescription>
          </div>
          <div>
            <Select value={timelineMode} onValueChange={setTimelineMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ChartContainer
            config={{
              count: { label: "Entries", color: "#8884d8" },
            }}
            className="h-60"
          >
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tickFormatter={formatXAxisLabel}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => [`${value} entries`, "Added"]}
                labelFormatter={(period) => formatXAxisLabel(period)}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}


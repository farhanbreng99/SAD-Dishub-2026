"use client";

import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  showGrid?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal";
  barRadius?: number;
  barSize?: number;
}

// Default color palette for bars
const COLORS = [
  "#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD",
  "#2563EB", "#1E40AF", "#BFDBFE", "#1E3A8A",
];

export default function BarChartComponent({
  data,
  height = 300,
  color = "#1D4ED8",
  showGrid = true,
  className,
  layout = "horizontal",
  barRadius = 6,
  barSize,
}: BarChartProps) {
  const isVertical = layout === "vertical";

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={isVertical ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 8, left: isVertical ? 80 : 0, bottom: 4 }}
          barCategoryGap="20%"
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              horizontal={!isVertical}
              vertical={isVertical}
            />
          )}

          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: "#64748B" }}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
            </>
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "13px",
              padding: "8px 12px",
            }}
            cursor={{ fill: "rgba(29, 78, 216, 0.05)" }}
          />

          <Bar
            dataKey="value"
            radius={[barRadius, barRadius, barRadius, barRadius]}
            maxBarSize={barSize || 48}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

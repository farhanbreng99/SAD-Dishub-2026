"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface DonutChartData {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabel?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

const COLORS = [
  "#1D4ED8", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#EC4899", "#64748B",
];

// Custom center label renderer
const CenterLabel = ({
  cx,
  cy,
  label,
  value,
}: {
  cx: number;
  cy: number;
  label?: string;
  value?: string | number;
}) => (
  <>
    {value !== undefined && (
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-surface-900 text-2xl font-bold"
        style={{ fontSize: "28px", fontWeight: 700, fontFamily: "Inter" }}
      >
        {value}
      </text>
    )}
    {label && (
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-surface-400 text-xs"
        style={{ fontSize: "12px", fontWeight: 500, fontFamily: "Inter" }}
      >
        {label}
      </text>
    )}
  </>
);

export default function DonutChart({
  data,
  height = 280,
  innerRadius = 60,
  outerRadius = 90,
  showLegend = true,
  showLabel = false,
  centerLabel,
  centerValue,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
                className="transition-opacity hover:opacity-80"
              />
            ))}
            {/* Center content */}
            {(centerLabel || centerValue !== undefined) && (
              <CenterLabel
                cx={0}
                cy={0}
                label={centerLabel}
                value={centerValue}
              />
            )}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "13px",
              padding: "8px 12px",
            }}
            formatter={(value: number, name: string) => [
              `${value} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
              name,
            ]}
          />

          {showLegend && (
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
              formatter={(value: string) => (
                <span className="text-surface-600 ml-1">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

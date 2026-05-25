"use client";

import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

interface LineChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  color: string;
  label?: string;
  dashed?: boolean;
}

interface LineChartProps {
  data: LineChartData[];
  lines?: LineConfig[];
  height?: number;
  showGrid?: boolean;
  showArea?: boolean;
  curved?: boolean;
  className?: string;
}

export default function LineChartComponent({
  data,
  lines = [{ dataKey: "value", color: "#1D4ED8", label: "Jumlah" }],
  height = 300,
  showGrid = true,
  showArea = true,
  curved = true,
  className,
}: LineChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          {/* Gradient definitions */}
          <defs>
            {lines.map((line, i) => (
              <linearGradient
                key={`gradient-${i}`}
                id={`lineGradient-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={line.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
          )}

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

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "13px",
              padding: "8px 12px",
            }}
          />

          {lines.map((line, i) => (
            <React.Fragment key={`line-${i}`}>
              {showArea && (
                <Area
                  type={curved ? "monotone" : "linear"}
                  dataKey={line.dataKey}
                  stroke="none"
                  fill={`url(#lineGradient-${i})`}
                  animationDuration={800}
                />
              )}
              <Line
                type={curved ? "monotone" : "linear"}
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2.5}
                strokeDasharray={line.dashed ? "5 5" : undefined}
                dot={{
                  r: 4,
                  fill: "white",
                  stroke: line.color,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: line.color,
                  stroke: "white",
                  strokeWidth: 2,
                }}
                animationDuration={800}
              />
            </React.Fragment>
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardChartPoint } from "@/features/dashboard/types";
import type { UserRole } from "@/types";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#081120] px-4 py-3 text-sm shadow-lg shadow-black/10">
      <p className="type-caption mb-2 text-white/40">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/65">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </div>
            <span className="font-medium text-white">{item.value.toLocaleString("en-US")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartFrame({
  children,
  heightClassName = "h-[320px] min-h-[320px]",
}: {
  children: ReactNode;
  heightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    const updateDimensions = () => {
      const nextWidth = Math.round(element.clientWidth);
      const nextHeight = Math.round(element.clientHeight);

      if (nextWidth <= 0 || nextHeight <= 0) {
        return;
      }

      setDimensions((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : {
              width: nextWidth,
              height: nextHeight,
            },
      );
    };

    const scheduleDimensionUpdate = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        updateDimensions();
      });
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setIsVisible(true);
        scheduleDimensionUpdate();
      },
      { rootMargin: "180px 0px" },
    );

    const resizeObserver = new ResizeObserver(scheduleDimensionUpdate);

    visibilityObserver.observe(element);
    resizeObserver.observe(element);

    scheduleDimensionUpdate();

    return () => {
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
    };
  }, []);

  const canRenderChart =
    isVisible && dimensions.width > 0 && dimensions.height > 0;

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(9,17,32,0.9),rgba(8,15,30,0.86))] p-3 shadow-lg shadow-black/10 ${heightClassName}`}
    >
      {canRenderChart ? (
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children as ReactElement}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="synapse-skeleton-shimmer h-full w-full rounded-[1.2rem] border border-white/8 bg-white/[0.04]" />
      )}
    </div>
  );
}
type SharedChartProps = {
  data: DashboardChartPoint[];
  role: UserRole;
};

export const AnalyticsOverviewChart = memo(function AnalyticsOverviewChart({
  data,
  role,
}: SharedChartProps) {
  return (
    <ChartFrame>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="primaryArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.42} />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="primaryStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="secondaryArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.34} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="secondaryStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey={role === "USER" ? "focusScore" : "activities"}
          stroke="url(#primaryStroke)"
          strokeWidth={2}
          fill="url(#primaryArea)"
          name={role === "USER" ? "Focus score" : "Activity"}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey={role === "USER" ? "reports" : role === "MANAGER" ? "teamVelocity" : "activeUsers"}
          stroke="url(#secondaryStroke)"
          strokeWidth={2}
          fill="url(#secondaryArea)"
          name={role === "USER" ? "Reports" : role === "MANAGER" ? "Team velocity" : "Active users"}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartFrame>
  );
});

export const DatabaseVisualizationChart = memo(function DatabaseVisualizationChart({
  data,
  role,
}: SharedChartProps) {
  return (
    <ChartFrame heightClassName="h-[260px] min-h-[260px]">
      <LineChart data={data}>
        <defs>
          <linearGradient id="reportsStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="activitiesStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="trafficStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="reports" stroke="url(#reportsStroke)" strokeWidth={3} strokeLinecap="round" dot={false} name="Reports" isAnimationActive={false} />
        <Line type="monotone" dataKey="activities" stroke="url(#activitiesStroke)" strokeWidth={3} strokeLinecap="round" dot={false} name="Activities" isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey={role === "USER" ? "focusScore" : "traffic"}
          stroke="url(#trafficStroke)"
          strokeWidth={3}
          strokeLinecap="round"
          dot={false}
          name={role === "USER" ? "Focus score" : "Traffic"}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartFrame>
  );
});

export const SystemLoadChart = memo(function SystemLoadChart({ data }: SharedChartProps) {
  return (
    <ChartFrame>
      <LineChart data={data}>
        <defs>
          <linearGradient id="cpuStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="memoryStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f9a8d4" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="latencyStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="cpuUsage" stroke="url(#cpuStroke)" strokeWidth={3} strokeLinecap="round" dot={false} name="CPU %" isAnimationActive={false} />
        <Line type="monotone" dataKey="memoryUsage" stroke="url(#memoryStroke)" strokeWidth={3} strokeLinecap="round" dot={false} name="Memory %" isAnimationActive={false} />
        <Line type="monotone" dataKey="latency" stroke="url(#latencyStroke)" strokeWidth={3} strokeLinecap="round" dot={false} name="Latency" isAnimationActive={false} />
      </LineChart>
    </ChartFrame>
  );
});

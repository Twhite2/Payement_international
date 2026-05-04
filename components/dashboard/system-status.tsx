"use client";

import React from "react";
import { Activity, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetrics } from "@/hooks/use-metrics";

export function SystemStatus() {
  const { data: metrics, isLoading } = useMetrics();

  const latest = metrics?.[metrics.length - 1];

  if (isLoading || !latest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: "Uptime",
      value: `${latest.uptimePercent}%`,
      icon: Activity,
      color:
        latest.uptimePercent >= 99.9
          ? "text-emerald-600"
          : latest.uptimePercent >= 99.0
          ? "text-amber-600"
          : "text-red-600",
    },
    {
      label: "Avg Latency",
      value: `${latest.latencyMs} ms`,
      icon: Clock,
      color:
        latest.latencyMs <= 60
          ? "text-emerald-600"
          : latest.latencyMs <= 100
          ? "text-amber-600"
          : "text-red-600",
    },
    {
      label: "Throughput",
      value: `${latest.throughputTps} TPS`,
      icon: Zap,
      color: "text-blue-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-md border border-border px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className={`text-sm font-semibold tabular-nums ${item.color}`}>
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

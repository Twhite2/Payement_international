"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemLogs } from "@/hooks/use-metrics";
import { formatDateTime } from "@/lib/format";

const levelStyles: Record<string, string> = {
  info: "text-blue-600",
  warn: "text-amber-600",
  error: "text-red-600",
};

export function SystemLogs() {
  const { data: logs, isLoading } = useSystemLogs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">System Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 rounded-md border border-border bg-muted/20">
          <div className="p-4 font-mono text-xs leading-6">
            {logs?.map((log) => (
              <div key={log.id} className="flex flex-wrap gap-x-2 gap-y-0 md:flex-nowrap">
                <span className="shrink-0 text-muted-foreground">
                  {formatDateTime(log.timestamp)}
                </span>
                <span
                  className={`shrink-0 w-12 text-right font-semibold uppercase ${
                    levelStyles[log.level] || "text-foreground"
                  }`}
                >
                  {log.level}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  [{log.source}]
                </span>
                <span className="text-foreground break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

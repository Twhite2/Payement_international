"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFraudAlerts } from "@/hooks/use-metrics";
import { formatDateTime, severityColor } from "@/lib/format";

export function FraudAlerts() {
  const { data: alerts, isLoading } = useFraudAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Fraud Detection Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          Fraud Detection Alerts
        </CardTitle>
        {alerts && (
          <Badge variant="outline" className="text-xs">
            {alerts.filter((a) => !a.resolved).length} active
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No alerts
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-md border p-3 ${
                  alert.resolved ? "opacity-60" : ""
                } ${severityColor(alert.severity)}`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase">
                      {alert.severity}
                    </span>
                    {alert.resolved && (
                      <Badge variant="secondary" className="text-[10px]">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs opacity-70">
                    <span className="font-mono">{alert.transactionId}</span>
                    <span>{formatDateTime(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

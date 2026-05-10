"use client";

import React from "react";
import { MetricsCharts } from "@/components/admin/metrics-charts";
import { FraudAlerts } from "@/components/admin/fraud-alerts";
import { SystemLogs } from "@/components/admin/system-logs";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <MetricsCharts />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden">
          <FraudAlerts />
        </div>
        <div className="min-w-0 overflow-hidden">
          <SystemLogs />
        </div>
      </div>
    </div>
  );
}

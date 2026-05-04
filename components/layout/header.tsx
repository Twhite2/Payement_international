"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/format";

interface Notification {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  transactionId?: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "success",
    title: "Payment Settled",
    message: "TXN-2025-00001 has been settled successfully.",
    timestamp: "2025-05-03T10:00:05Z",
    transactionId: "TXN-2025-00001",
    read: false,
  },
  {
    id: "n2",
    type: "warning",
    title: "Fraud Alert Triggered",
    message: "Cross-border transfer TXN-2025-00002 flagged for enhanced due diligence.",
    timestamp: "2025-05-03T11:30:01Z",
    transactionId: "TXN-2025-00002",
    read: false,
  },
  {
    id: "n3",
    type: "info",
    title: "FX Rate Updated",
    message: "NGN/USD rate updated to 1,600.00.",
    timestamp: "2025-05-03T12:00:00Z",
    read: true,
  },
  {
    id: "n4",
    type: "success",
    title: "Payment Settled",
    message: "TXN-2025-00005 has been settled successfully.",
    timestamp: "2025-05-02T14:00:05Z",
    transactionId: "TXN-2025-00005",
    read: true,
  },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/send": "Send Payment",
  "/transactions": "Transactions",
  "/admin": "Monitoring",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/transactions/")) return "Transaction Detail";
  return pageTitles[pathname] || "Dashboard";
}

const typeIcon = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const typeColor = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          System Online
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]"
              >
                {unreadCount}
              </Badge>
            )}
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-xs text-muted-foreground"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <Separator />
                <ScrollArea className="max-h-80">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    <div>
                      {notifications.map((n) => {
                        const Icon = typeIcon[n.type];
                        return (
                          <div
                            key={n.id}
                            className={`relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                              !n.read ? "bg-muted/30" : ""
                            }`}
                            onClick={() => {
                              markRead(n.id);
                              if (n.transactionId) {
                                setOpen(false);
                                router.push(`/transactions/${n.transactionId}`);
                              }
                            }}
                          >
                            <Icon
                              className={`mt-0.5 h-4 w-4 shrink-0 ${typeColor[n.type]}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {n.message}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDateTime(n.timestamp)}
                                </span>
                                {n.transactionId && (
                                  <Link
                                    href={`/transactions/${n.transactionId}`}
                                    className="text-[11px] font-medium text-primary hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpen(false);
                                    }}
                                  >
                                    View
                                  </Link>
                                )}
                              </div>
                            </div>
                            <button
                              className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 hover:opacity-100"
                              style={{ opacity: undefined }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.opacity = "1")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.opacity = "0")
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(n.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

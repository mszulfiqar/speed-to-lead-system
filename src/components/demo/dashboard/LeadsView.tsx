"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  service: string | null;
  status: string;
  urgency: string | null;
  createdAt: string;
  conversationId: string | null;
};

type DashboardData = {
  leads: Lead[];
};

type Props = {
  sessionId: string;
};

export default function LeadsView({
  sessionId,
}: Props) {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadLeads() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/demo/dashboard?sessionId=${sessionId}`
        );

        const result: DashboardData & {
          error?: string;
        } = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Failed to load leads"
          );
        }

        setLeads(result.leads);
      } catch (error) {
        console.error(
          "Failed to load leads:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load leads"
        );
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, [sessionId]);

  function openConversation(
    conversationId: string
  ) {
    router.push(
      `/demo/dashboard/conversations?sessionId=${sessionId}&conversationId=${conversationId}`
    );
  }

  /* Loading */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader />

        <Card>
          <CardContent className="flex min-h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading leads...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader />

        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader />

      <Card className="overflow-hidden">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-base font-semibold">
            All Leads
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Leads captured by your AI.
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {/* Table header */}
              <div className="hidden border-b bg-slate-50 px-5 py-3 md:grid md:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr] md:gap-4">
                <HeaderCell>Customer</HeaderCell>
                <HeaderCell>Service</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Urgency</HeaderCell>
                <HeaderCell>Action</HeaderCell>
              </div>

              {/* Leads */}
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="border-b last:border-b-0"
                >
                  <div className="grid gap-4 px-5 py-4 md:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr] md:items-center">
                    {/* Customer */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-950">
                        {lead.name ||
                          "Unknown customer"}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {lead.phone ||
                          "No phone"}
                      </p>
                    </div>

                    {/* Service */}
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground md:hidden">
                        Service
                      </p>

                      <p className="text-sm text-slate-700">
                        {lead.service || "—"}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground md:hidden">
                        Status
                      </p>

                      <StatusBadge
                        value={lead.status}
                        type="status"
                      />
                    </div>

                    {/* Urgency */}
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground md:hidden">
                        Urgency
                      </p>

                      {lead.urgency ? (
                        <StatusBadge
                          value={lead.urgency}
                          type="urgency"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="md:text-right">
                      {lead.conversationId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openConversation(
                              lead.conversationId!
                            )
                          }
                          className="gap-2 px-2 text-slate-700 hover:text-emerald-600"
                        >
                          <MessageSquare className="size-4" />
                          View chat
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No conversation
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-8">
      <p className="mb-2 text-sm font-medium text-emerald-600">
        Lead Management
      </p>

      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        Leads
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        All leads captured by your AI.
      </p>
    </div>
  );
}

function HeaderCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-slate-100">
        <MessageSquare className="size-4 text-slate-500" />
      </div>

      <p className="text-sm font-medium text-slate-700">
        No leads yet
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        New leads will appear here.
      </p>
    </div>
  );
}

function StatusBadge({
  type,
  value,
}: {
  type: "status" | "urgency";
  value: string;
}) {
  const normalized = value.toUpperCase();

  let className =
    "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-100";

  if (type === "status") {
    if (
      normalized === "BOOKED" ||
      normalized === "CONTACTED"
    ) {
      className =
        "border-transparent bg-green-50 text-green-700 hover:bg-green-50";
    }

    if (
      normalized === "WAITING_FOR_HUMAN"
    ) {
      className =
        "border-transparent bg-yellow-50 text-yellow-700 hover:bg-yellow-50";
    }

    if (normalized === "LOST") {
      className =
        "border-transparent bg-red-50 text-red-600 hover:bg-red-50";
    }
  }

  if (type === "urgency") {
    if (normalized === "HIGH") {
      className =
        "border-transparent bg-red-50 text-red-600 hover:bg-red-50";
    }

    if (normalized === "MEDIUM") {
      className =
        "border-transparent bg-yellow-50 text-yellow-700 hover:bg-yellow-50";
    }

    if (normalized === "LOW") {
      className =
        "border-transparent bg-green-50 text-green-700 hover:bg-green-50";
    }
  }

  return (
    <Badge
      variant="outline"
      className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${className}`}
    >
      {normalized.replaceAll("_", " ")}
    </Badge>
  );
}

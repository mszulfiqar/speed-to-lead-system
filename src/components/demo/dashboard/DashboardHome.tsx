import {
  ArrowUpRight,
  Clock3,
  MessageSquare,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  stats: {
    totalLeads: number;
    aiConversations: number;
    waitingForHuman: number;
  };
  leads: Lead[];
};

type Props = {
  data: DashboardData;
};

export default function DashboardHome({
  data,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-emerald-600">
          Overview
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Here's what's happening with your leads.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={data.stats.totalLeads}
          description="All incoming leads"
          icon={Users}
        />

        <StatCard
          label="AI Conversations"
          value={data.stats.aiConversations}
          description="Handled by AI"
          icon={MessageSquare}
        />

        <StatCard
          label="Need Reply"
          value={data.stats.waitingForHuman}
          description="Waiting for your team"
          icon={Clock3}
          accent
        />

        <StatCard
          label="Pipeline"
          value="$12.4k"
          description="Estimated opportunity"
          icon={ArrowUpRight}
        />
      </div>

      {/* Recent Leads */}
      <Card className="mt-8 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b px-5 py-4">
          <div>
            <CardTitle className="text-base font-semibold">
              Recent Leads
            </CardTitle>

            <p className="mt-1 text-sm text-slate-500">
              Your latest incoming opportunities.
            </p>
          </div>

          <button
            type="button"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            View all
          </button>
        </CardHeader>

        <CardContent className="p-0">
          {data.leads.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">
                No leads yet.
              </p>
            </div>
          ) : (
            <div>
              {data.leads.map((lead, index) => (
                <div
                  key={lead.id}
                  className={`flex min-h-16 items-center gap-4 px-5 py-3 transition hover:bg-slate-50 ${
                    index !== data.leads.length - 1
                      ? "border-b"
                      : ""
                  }`}
                >
                  {/* Customer */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-950">
                      {lead.name || "Unknown Customer"}
                    </p>

                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {lead.phone || "No phone"}
                    </p>
                  </div>

                  {/* Service */}
                  <div className="hidden w-40 md:block">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {lead.service || "Not specified"}
                    </p>
                  </div>

                  {/* Urgency */}
                  <div className="hidden w-24 sm:block">
                    {lead.urgency && (
                      <StatusBadge
                        type="urgency"
                        value={lead.urgency}
                      />
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-32">
                    <StatusBadge
                      type="status"
                      value={lead.status}
                    />
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

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <div
            className={`flex size-8 items-center justify-center rounded-md ${
              accent
                ? "bg-yellow-50 text-yellow-600"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Icon className="size-4" />
          </div>
        </div>

        <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </CardContent>
    </Card>
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

    if (normalized === "WAITING_FOR_HUMAN") {
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

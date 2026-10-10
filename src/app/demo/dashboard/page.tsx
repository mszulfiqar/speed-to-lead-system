// 


"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import DashboardHome from "@/components/demo/dashboard/DashboardHome";

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

export default function DemoDashboardPage() {
  const searchParams =
    useSearchParams();

  const sessionId =
    searchParams.get("sessionId");

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!sessionId) {
        setError("Missing demo session.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/demo/dashboard?sessionId=${sessionId}`
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load dashboard"
          );
        }

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <DashboardHome data={data} />
  );
}

"use client";

import { useSearchParams } from "next/navigation";

import LeadsView from "@/components/demo/dashboard/LeadsView";

export default function LeadsPage() {
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-6">
        <p className="text-sm text-red-600">
          Missing demo session.
        </p>
      </div>
    );
  }

  return (
    <LeadsView sessionId={sessionId} />
  );
}

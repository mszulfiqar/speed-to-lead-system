"use client";

import { useSearchParams } from "next/navigation";

import Sidebar from "@/components/demo/dashboard/Sidebar";
import Topbar from "@/components/demo/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      {/* Fixed Topbar */}
      <div className="fixed inset-x-0 top-0 z-50 h-16">
        <Topbar />
      </div>

      {/* Fixed Sidebar */}
      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-64 lg:block">
        <Sidebar sessionId={sessionId} />
      </aside>

      {/* Scrollable Center Content */}
      <main className="h-screen overflow-y-auto pt-16 lg:pl-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

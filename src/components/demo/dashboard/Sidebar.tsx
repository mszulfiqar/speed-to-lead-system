
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/demo/dashboard",
  },
  {
    id: "leads",
    label: "Leads",
    icon: Users,
    path: "/demo/dashboard/leads",
  },
  {
    id: "conversations",
    label: "Conversations",
    icon: MessageSquare,
    path: "/demo/dashboard/conversations",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    path: "/demo/dashboard/calendar",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    path: "/demo/dashboard/analytics",
  },
  {
    id: "automations",
    label: "Automations",
    icon: Bot,
    path: "/demo/dashboard/automations",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/demo/dashboard/settings",
  },
];

type Props = {
  sessionId: string | null;
};

export default function Sidebar({
  sessionId,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function navigate(path: string) {
    const params = new URLSearchParams();

    if (sessionId) {
      params.set("sessionId", sessionId);
    }

    const queryString = params.toString();

    router.push(
      queryString
        ? `${path}?${queryString}`
        : path
    );
  }

  return (
    <aside className="hidden min-h-[calc(100vh-64px)] w-64 shrink-0 border-r bg-white lg:block">
      <div className="flex min-h-[calc(100vh-64px)] flex-col px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const active =
              item.id === "dashboard"
                ? pathname === "/demo/dashboard"
                : pathname.startsWith(item.path);

            const Icon = item.icon;

            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`h-10 w-full justify-start gap-3 px-3 text-sm font-medium ${
                  active
                    ? "bg-slate-100 text-slate-950 hover:bg-slate-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="size-4 shrink-0" />

                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Separator className="mb-4" />

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Demo account
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              John HVAC
            </p>

            <p className="mt-1 text-xs text-slate-500">
              AI Speed-to-Lead
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

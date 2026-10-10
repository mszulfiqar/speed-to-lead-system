"use client";

import { Bell } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-white">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
            AI
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-slate-950">
              AI Speed-to-Lead
            </p>

            <p className="text-xs text-slate-500">
              John HVAC
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-900"
          >
            <Bell className="size-4" />
            <span className="sr-only">
              Notifications
            </span>
          </Button>

          <Separator
            orientation="vertical"
            className="mx-1 h-6"
          />

          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-700">
                JH
              </AvatarFallback>
            </Avatar>

            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-900">
                John HVAC
              </p>

              <p className="text-xs text-slate-500">
                Demo account
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

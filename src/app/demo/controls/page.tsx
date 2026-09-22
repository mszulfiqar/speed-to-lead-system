"use client";

import { leadSources } from "@/lib/data";
import { useRouter } from "next/navigation";

export default function DemoControlPage() {
  const router = useRouter();

  // function selectLeadSource(source: string) {
  //   router.push(`/demo/leads/${source}`);
  // }


  async function selectLeadSource(source: string) {
  try {
    const response = await fetch("/api/demo/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create demo session");
    }

    const data = await response.json();

    router.push(`/demo/leads/${source}?sessionId=${data.sessionId}`);
  } catch (error) {
    console.error("Failed to start demo:", error);
  }
}

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="w-full">
          {/* Header */}
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mb-4 inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 shadow-sm">
              Demo Control Center
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simulate a new lead
            </h1>

            <p className="mt-3 text-zinc-500">
              Choose where the lead came from to start a realistic customer
              interaction.
            </p>
          </div>

          {/* Lead Sources */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leadSources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => selectLeadSource(source.id)}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-xl">
                    {source.icon}
                  </div>

                  <span className="text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-500">
                    →
                  </span>
                </div>

                <h2 className="font-medium">{source.name}</h2>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  {source.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
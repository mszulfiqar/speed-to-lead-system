import { leadSources } from "@/lib/data";
import { getDemoSession } from "@/lib/demo-session";
import { notFound, redirect } from "next/navigation";
import WebsiteLeadForm from "./WebsiteLeadForm";

type Props = {
    params: Promise<{
        source: string;
    }>;
    searchParams: Promise<{
        sessionId?: string;
    }>;
};

export default async function DemoLeadPage({
    params,
    searchParams,
}: Props) {
    const { source } = await params;
    const { sessionId } = await searchParams;

    const leadSource = leadSources.find(
        (item) => item.id === source
    );

    if (!leadSource) {
        notFound();
    }

    if (!sessionId) {
        redirect("/demo/controls");
    }

    const session = await getDemoSession(sessionId);

    if (!session) {
        redirect("/demo/controls");
    }

    if (source === "website") {
        return <WebsiteLeadForm sessionId={session.id} />;
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50">
            <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
                <div className="text-4xl">
                    {leadSource.icon}
                </div>

                <h1 className="mt-4 text-2xl font-semibold">
                    {leadSource.name}
                </h1>

                <p className="mt-2 text-zinc-500">
                    {leadSource.description}
                </p>

                <div className="mt-6 rounded-lg bg-zinc-100 p-4 text-sm">
                    <p>
                        <strong>Source:</strong> {leadSource.id}
                    </p>

                    <p className="mt-1 break-all">
                        <strong>Session:</strong> {session.id}
                    </p>
                </div>
            </div>
        </main>
    );
}
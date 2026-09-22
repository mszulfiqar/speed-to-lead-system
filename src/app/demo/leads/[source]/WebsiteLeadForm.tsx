"use client";

import { useState } from "react";

type Props = {
  sessionId: string;
};

export default function WebsiteLeadForm({ sessionId }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/demo/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        name,
        phone,
        service,
        message,
      }),
    });


    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to submit lead");
    }
    console.log("FORM SESSION ID:", sessionId);
    console.log("CONVERSATION ID:", data.conversation.id);
    window.location.href =
      `/demo/chat?conversationId=${data.conversation.id}&sessionId=${sessionId}`;
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-medium text-zinc-500">
              Demo HVAC Company
            </p>

            <h1 className="mt-1 text-2xl font-semibold">
              How can we help?
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Tell us what you need and we'll get back to you shortly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Phone
              </label>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                What do you need help with?
              </label>

              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none"
              >
                <option value="">Select a service</option>
                <option value="AC Repair">AC Repair</option>
                <option value="Heating Repair">Heating Repair</option>
                <option value="AC Installation">AC Installation</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Tell us more
              </label>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                placeholder="My AC stopped working..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-800"
            >
              Get Help
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
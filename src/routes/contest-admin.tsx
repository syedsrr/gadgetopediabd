import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getContestAdminData } from "@/lib/contest.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contest-admin")({
  head: () => ({
    meta: [
      { title: "Contest Admin — gadgetOpedia" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ContestAdminPage,
});

type Entry = {
  id: string;
  status: string;
  assigned_at: string;
  claim_deadline: string;
  completed_at: string | null;
  expired_at: string | null;
  contest_prizes: { prize_name: string } | null;
  contest_claims: { full_name: string; kd_batch_number: string; phone_number: string; review: string | null; submitted_at: string } | null;
};

function ContestAdminPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session) throw new Error("Sign in to your staging Supabase account first.");
      setSignedIn(true);
      const result = await getContestAdminData({ data: { accessToken: data.session.access_token } });
      setEntries(result.entries as Entry[]);
    } catch (e) {
      setEntries([]);
      setError(e instanceof Error ? e.message : "Could not load contest admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">gadgetOpedia</p>
          <h1 className="mt-1 text-2xl font-bold">QR Contest Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Private claim records. Access is checked on the server.</p>
        </div>
        <div className="flex gap-2">
          {signedIn && <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); setSignedIn(false); setEntries([]); setError("Signed out."); }}>Sign out</Button>}
          <Button variant="outline" onClick={() => void load()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
        </div>
      </div>

      {error && <div role="alert" className="mt-5 rounded-lg border p-4 text-sm">{error}<p className="mt-2 text-muted-foreground">Only a user explicitly added to the staging contest_admins allowlist can view claim details.</p></div>}
      {loading && <p className="mt-6 text-sm text-muted-foreground">Loading contest records…</p>}
      {!loading && !error && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Total assignments</p><p className="mt-1 text-2xl font-bold">{entries.length}</p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Completed claims</p><p className="mt-1 text-2xl font-bold">{entries.filter(e => e.status === "completed").length}</p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Expired claims</p><p className="mt-1 text-2xl font-bold">{entries.filter(e => e.status === "expired").length}</p></div>
          </div>
          <div className="mt-6 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50"><tr><th className="p-3">Prize</th><th className="p-3">Status</th><th className="p-3">Assigned</th><th className="p-3">Deadline</th><th className="p-3">Winner details</th><th className="p-3">Review</th></tr></thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-t align-top">
                    <td className="p-3">{entry.contest_prizes?.prize_name ?? "Prize"}</td>
                    <td className="p-3 capitalize">{entry.status}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(entry.assigned_at).toLocaleString()}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(entry.claim_deadline).toLocaleString()}</td>
                    <td className="p-3">{entry.contest_claims ? <div><p className="font-medium">{entry.contest_claims.full_name}</p><p>{entry.contest_claims.kd_batch_number}</p><p>{entry.contest_claims.phone_number}</p></div> : "Not submitted"}</td>
                    <td className="p-3 max-w-xs whitespace-pre-wrap">{entry.contest_claims?.review || "—"}</td>
                  </tr>
                ))}
                {entries.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No contest entries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

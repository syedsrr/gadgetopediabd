import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { assignContestPrize, submitContestClaim } from "@/lib/contest.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contest")({
  head: () => ({
    meta: [
      { title: "QR Prize Contest — gadgetOpedia" },
      { name: "description", content: "Check your Gadgetopedia QR contest prize and complete your claim." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ContestPage,
});

function ContestPage() {
  const [entry, setEntry] = useState<null | { entryId: string; prizeName: string; claimDeadline: string; claimToken: string }>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showReminder, setShowReminder] = useState(true);

  async function checkPrize() {
    setLoading(true);
    try {
      const result = await assignContestPrize();
      if (!result.available) {
        setUnavailable(true);
        setEntry(null);
      } else {
        setUnavailable(false);
        setEntry(result);
        setShowReminder(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Contest is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function submitClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entry) return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      await submitContestClaim({
        data: {
          entryId: entry.entryId,
          claimToken: entry.claimToken,
          fullName: String(form.get("fullName") ?? ""),
          kdBatchNumber: String(form.get("kdBatchNumber") ?? ""),
          phoneNumber: String(form.get("phoneNumber") ?? ""),
          review: String(form.get("review") ?? ""),
        },
      });
      setSubmitted(true);
      setEntry(null);
      setShowReminder(false);
      toast.success("Your prize claim has been submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't submit your claim.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-10 sm:py-16">
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">gadgetOpedia QR contest</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Your chance to win</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Check prize availability, then complete your claim before the 24-hour deadline.</p>

        {!entry && !submitted && !unavailable && (
          <Button className="mt-6 w-full" disabled={loading} onClick={checkPrize}>
            {loading ? "Checking…" : "Check My Prize"}
          </Button>
        )}
        {unavailable && !submitted && (
          <div className="mt-6 rounded-lg border p-4">
            <h2 className="font-semibold">All prizes have been claimed</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please check again later in case an incomplete claim expires.</p>
            <Button className="mt-4" variant="outline" disabled={loading} onClick={() => { setUnavailable(false); void checkPrize(); }}>Check Again</Button>
          </div>
        )}
        {entry && !submitted && (
          <>
            <div className="mt-6 rounded-xl bg-primary/10 p-4">
              <p className="text-sm text-muted-foreground">Your assigned prize</p>
              <p className="text-2xl font-bold">{entry.prizeName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Claim deadline: {new Date(entry.claimDeadline).toLocaleString()}</p>
            </div>

            {showReminder && (
              <div role="dialog" aria-modal="true" aria-labelledby="claim-reminder-title" className="mt-4 rounded-xl border border-primary/30 bg-background p-4">
                <h2 id="claim-reminder-title" className="font-semibold">Don't miss your prize!</h2>
                <p className="mt-2 text-sm leading-6">Don't miss your prize! To collect your prize, submit your name, KD batch number, and phone number. Your review is optional. If you leave without submitting, your prize claim will remain incomplete.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => setShowReminder(false)} className="w-full">Complete My Claim</Button>
                  <Button onClick={() => { setEntry(null); setShowReminder(false); }} variant="outline" className="w-full">Leave Anyway</Button>
                </div>
              </div>
            )}

            {!showReminder && entry && (
              <form onSubmit={submitClaim} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kdBatchNumber">KD batch number</Label>
                  <Input id="kdBatchNumber" name="kdBatchNumber" required maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone number</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" required minLength={7} maxLength={25} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review">Review (optional)</Label>
                  <Textarea id="review" name="review" maxLength={2000} placeholder="Share your experience (optional)" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Submitting…" : "Submit My Claim"}</Button>
                <p className="text-xs text-muted-foreground">Your claim must be submitted within 24 hours of prize assignment.</p>
              </form>
            )}
          </>
        )}
        {submitted && (
          <div className="mt-6 rounded-lg border p-4" role="status">
            <h2 className="font-semibold">Claim submitted successfully</h2>
            <p className="mt-1 text-sm text-muted-foreground">Keep your phone available for prize-collection instructions.</p>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-muted-foreground">Contest claims are private and are handled securely.</p>
      </div>
    </main>
  );
}

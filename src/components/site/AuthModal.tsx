import { useState } from "react";
import { toast } from "sonner";

import { SocialAuthButtons } from "@/components/site/SocialAuthButtons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthModal({ open, onOpenChange }: Props) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  function normalizedPhone() {
    const raw = phone.replace(/[\s-]/g, "");
    if (raw.startsWith("+")) return raw;
    if (raw.startsWith("0")) return `+88${raw}`;
    return `+${raw}`;
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone() });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOtpSent(true);
    toast.success("We sent a 6-digit code to your phone");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone(),
      token: otp,
      type: "sms",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You're signed in");
    onOpenChange(false);
  }

  async function emailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Signed in");
      onOpenChange(false);
    }
  }

  async function emailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { full_name: fullName, phone: phone.trim() || null },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created. Check your inbox to confirm your email.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Sign in or create an account</DialogTitle>
          <DialogDescription>
            Use your mobile number for a one-time SMS code, or continue with email.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          <SocialAuthButtons onSuccess={() => onOpenChange(false)} />
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>

        <Tabs defaultValue="phone" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone">Phone / OTP</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="phone" className="mt-4">
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-phone">Mobile number</Label>
                  <Input
                    id="auth-phone"
                    required
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-otp">6-digit code</Label>
                  <Input
                    id="auth-otp"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="text-center font-display text-lg tracking-[0.5em]"
                  />
                  <p className="text-xs text-muted-foreground">Sent to {normalizedPhone()}</p>
                </div>
                <Button type="submit" className="w-full" disabled={busy || otp.length !== 6}>
                  {busy ? "Verifying…" : "Verify & sign in"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                >
                  Use a different number
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <form onSubmit={emailSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy || !email || password.length < 6}
                onClick={emailSignUp}
              >
                Create an account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

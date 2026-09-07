import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";

type Provider = "google" | "apple";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.97 11.97 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M16.36 12.79c.03 3.2 2.81 4.27 2.84 4.28-.02.08-.44 1.52-1.46 3-.88 1.28-1.79 2.55-3.23 2.58-1.41.03-1.87-.83-3.49-.83-1.62 0-2.12.8-3.46.86-1.39.05-2.45-1.38-3.33-2.66-1.82-2.62-3.2-7.42-1.34-10.65.93-1.6 2.58-2.62 4.38-2.65 1.36-.03 2.65.92 3.49.92.83 0 2.4-1.13 4.05-.97.69.03 2.63.28 3.87 2.11-.1.06-2.31 1.35-2.29 4.02M13.68 3.61c.74-.89 1.23-2.13 1.1-3.36-1.06.04-2.34.71-3.1 1.6-.68.79-1.28 2.05-1.12 3.26 1.18.09 2.39-.6 3.12-1.5" />
    </svg>
  );
}

type Props = {
  onSuccess?: () => void;
};

export function SocialAuthButtons({ onSuccess }: Props) {
  const [busy, setBusy] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    setBusy(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    setBusy(null);

    if (result.error) {
      toast.error(result.error.message || "Sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;

    toast.success("You're signed in");
    onSuccess?.();
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={busy !== null}
        onClick={() => signIn("google")}
      >
        <GoogleIcon />
        {busy === "google" ? "Connecting…" : "Google"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busy !== null}
        onClick={() => signIn("apple")}
      >
        <AppleIcon />
        {busy === "apple" ? "Connecting…" : "Apple"}
      </Button>
    </div>
  );
}

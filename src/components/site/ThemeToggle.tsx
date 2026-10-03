import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      {dark ? <Sun className={iconClassName} /> : <Moon className={iconClassName} />}
    </Button>
  );
}

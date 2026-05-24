import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard } from "lucide-react";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground font-bold">P</div>
          <span className="font-display font-semibold text-lg">Pulse CRM</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user && isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><LayoutDashboard className="size-4" /> Dashboard</Link>
            </Button>
          )}
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Admin login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

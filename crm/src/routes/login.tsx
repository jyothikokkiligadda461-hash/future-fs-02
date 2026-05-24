import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin login — Pulse CRM" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin" });
  }, [user, loading, navigate]);

  async function handle(mode: "signin" | "signup") {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. Check your inbox to confirm, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back!");
      navigate({ to: "/admin" });
    }
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="size-8 rounded-md bg-primary grid place-items-center text-primary-foreground font-bold">P</div>
          <span className="font-display font-semibold text-xl">Pulse CRM</span>
        </Link>
        <Card className="p-7">
          <h1 className="font-display text-2xl font-semibold">Admin access</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage leads.</p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-5">
              <Field label="Email" id="e1" type="email" value={email} setValue={setEmail} />
              <Field label="Password" id="p1" type="password" value={password} setValue={setPassword} />
              <Button className="w-full" disabled={busy} onClick={() => handle("signin")}>
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-5">
              <p className="text-xs text-muted-foreground">The first account created becomes the admin.</p>
              <Field label="Email" id="e2" type="email" value={email} setValue={setEmail} />
              <Field label="Password" id="p2" type="password" value={password} setValue={setPassword} />
              <Button className="w-full" disabled={busy} onClick={() => handle("signup")}>
                {busy ? "Creating..." : "Create account"}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, id, type, value, setValue }: { label: string; id: string; type: string; value: string; setValue: (v: string) => void; }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

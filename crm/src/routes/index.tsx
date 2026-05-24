import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRight, Inbox, Users, TrendingUp, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse CRM — Capture & convert website leads" },
      { name: "description", content: "A simple CRM to manage client leads from your website contact forms. Track status, add notes, convert more." },
    ],
  }),
  component: Landing,
});

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  company: z.string().trim().max(150).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

function Landing() {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      source: "website",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit. Try again.");
      return;
    }
    toast.success("Thanks! We'll be in touch shortly.");
    setForm({ name: "", email: "", company: "", phone: "", message: "" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.06_260)_0%,_transparent_60%)]" />
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success" /> Lead pipeline, simplified
              </div>
              <h1 className="mt-5 text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
                Turn website visitors into <span className="text-primary">paying clients.</span>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-lg">
                Pulse CRM captures every lead from your contact forms, tracks status, and keeps your follow-ups organized — all in one secure admin panel.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <a href="#contact">Get a demo <ArrowRight className="size-4" /></a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">See features</a>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                {[
                  { k: "100%", v: "Lead capture" },
                  { k: "3-step", v: "Pipeline" },
                  { k: "Secure", v: "Admin access" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="text-2xl font-display font-bold text-foreground">{s.k}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact form */}
            <Card id="contact" className="p-7 shadow-xl shadow-primary/5 border-border/80">
              <h2 className="font-display text-2xl font-semibold">Contact us</h2>
              <p className="text-sm text-muted-foreground mt-1">Drop your details — this form feeds straight into the CRM.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">How can we help?</Label>
                  <Textarea id="message" rows={4} value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send message"}
                </Button>
              </form>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-center">Everything you need to manage leads</h2>
          <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">A focused workflow — capture, qualify, convert.</p>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { i: Inbox, t: "Auto-capture", d: "Every contact-form submission lands in your inbox instantly." },
              { i: Users, t: "Pipeline", d: "Track each lead through new → contacted → converted." },
              { i: TrendingUp, t: "Follow-ups", d: "Add timestamped notes so nothing slips through." },
              { i: Shield, t: "Secure", d: "Role-based admin access — only you see the data." },
            ].map((f) => (
              <Card key={f.t} className="p-6">
                <div className="size-10 rounded-lg bg-accent grid place-items-center text-primary">
                  <f.i className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} Pulse CRM</span>
          <span>Built with care.</span>
        </div>
      </footer>
    </div>
  );
}

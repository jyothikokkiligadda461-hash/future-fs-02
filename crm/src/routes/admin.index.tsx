import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowRight, Inbox, PhoneCall, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: LeadsList,
});

type Lead = Tables<"leads">;
type Status = Enums<"lead_status">;

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof Inbox }> = {
  new:       { label: "New",       cls: "bg-info/15 text-info-foreground border-info/30",          icon: Inbox },
  contacted: { label: "Contacted", cls: "bg-warning/20 text-warning-foreground border-warning/40", icon: PhoneCall },
  converted: { label: "Converted", cls: "bg-success/20 text-success-foreground border-success/40", icon: CheckCircle2 },
};

function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLeads(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
  }), [leads]);

  const filtered = leads.filter((l) => {
    if (filter !== "all" && l.status !== filter) return false;
    if (q) {
      const s = q.toLowerCase();
      return l.name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || (l.company ?? "").toLowerCase().includes(s);
    }
    return true;
  });

  async function updateStatus(id: string, status: Status) {
    const prev = leads;
    setLeads(leads.map((l) => l.id === id ? { ...l, status } : l));
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); setLeads(prev); }
    else toast.success(`Marked as ${status}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">All submissions from your website contact forms.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Stat label="Total leads" value={stats.total} tone="default" />
        <Stat label="New" value={stats.new} tone="info" />
        <Stat label="Contacted" value={stats.contacted} tone="warning" />
        <Stat label="Converted" value={stats.converted} tone="success" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mt-8 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card className="mt-5 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading leads…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="size-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground">Submissions will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((l) => {
              const meta = STATUS_META[l.status];
              return (
                <div key={l.id} className="p-5 flex items-center gap-4 hover:bg-accent/40 transition-colors">
                  <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                    {l.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{l.name}</span>
                      <Badge variant="outline" className={meta.cls}>
                        <meta.icon className="size-3" /> {meta.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate mt-0.5">
                      {l.email}{l.company ? ` · ${l.company}` : ""}
                    </div>
                  </div>
                  <div className="hidden md:block text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString()}
                  </div>
                  <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v as Status)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/admin/leads/$leadId" params={{ leadId: l.id }}>
                      Open <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "default" | "info" | "warning" | "success" }) {
  const tones = {
    default: "from-primary/10 to-primary/5 text-primary",
    info: "from-info/15 to-info/5 text-info",
    warning: "from-warning/20 to-warning/5 text-warning",
    success: "from-success/15 to-success/5 text-success",
  };
  return (
    <Card className={`p-5 bg-gradient-to-br ${tones[tone]} border-border/60`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="text-3xl font-display font-bold mt-2 text-foreground">{value}</div>
    </Card>
  );
}

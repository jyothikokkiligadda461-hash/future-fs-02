import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Building2, Calendar, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads/$leadId")({
  component: LeadDetail,
});

type Lead = Tables<"leads">;
type Note = Tables<"lead_notes">;
type Status = Enums<"lead_status">;

function LeadDetail() {
  const { leadId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function load() {
    const [{ data: l }, { data: n }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
      supabase.from("lead_notes").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }),
    ]);
    setLead(l);
    setNotes(n ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [leadId]);

  async function updateStatus(status: Status) {
    if (!lead) return;
    setLead({ ...lead, status });
    const { error } = await supabase.from("leads").update({ status }).eq("id", lead.id);
    if (error) toast.error(error.message); else toast.success(`Status: ${status}`);
  }

  async function addNote() {
    if (!noteText.trim() || !user) return;
    if (noteText.length > 2000) { toast.error("Note too long"); return; }
    setPosting(true);
    const { data, error } = await supabase.from("lead_notes")
      .insert({ lead_id: leadId, author_id: user.id, content: noteText.trim() })
      .select().single();
    setPosting(false);
    if (error) return toast.error(error.message);
    setNotes([data, ...notes]);
    setNoteText("");
    toast.success("Note added");
  }

  async function deleteNote(id: string) {
    const prev = notes;
    setNotes(notes.filter((n) => n.id !== id));
    const { error } = await supabase.from("lead_notes").delete().eq("id", id);
    if (error) { toast.error(error.message); setNotes(prev); }
  }

  async function deleteLead() {
    if (!lead) return;
    if (!confirm("Delete this lead and all notes?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) return toast.error(error.message);
    toast.success("Lead deleted");
    navigate({ to: "/admin" });
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!lead) return <div className="p-10 text-center">Lead not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin"><ArrowLeft className="size-4" /> Back to leads</Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex gap-4 items-center">
                <div className="size-14 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-xl">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold">{lead.name}</h1>
                  <Badge variant="outline" className="mt-1 capitalize">{lead.source}</Badge>
                </div>
              </div>
              <Select value={lead.status} onValueChange={(v) => updateStatus(v as Status)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-6 text-sm">
              <Detail icon={Mail} label="Email" value={<a className="text-primary hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>} />
              {lead.phone && <Detail icon={Phone} label="Phone" value={lead.phone} />}
              {lead.company && <Detail icon={Building2} label="Company" value={lead.company} />}
              <Detail icon={Calendar} label="Submitted" value={new Date(lead.created_at).toLocaleString()} />
            </div>

            {lead.message && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Message</div>
                <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">{lead.message}</div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" onClick={deleteLead} className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" /> Delete lead
              </Button>
            </div>
          </Card>
        </div>

        {/* Notes */}
        <div>
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">Follow-up notes</h2>
            <p className="text-xs text-muted-foreground mt-1">Track every call, email, and step.</p>
            <div className="mt-4 space-y-2">
              <Textarea rows={3} placeholder="Add a follow-up note…" value={noteText}
                onChange={(e) => setNoteText(e.target.value)} />
              <Button onClick={addNote} disabled={posting || !noteText.trim()} className="w-full">
                <Send className="size-4" /> {posting ? "Saving..." : "Add note"}
              </Button>
            </div>

            <div className="mt-6 space-y-3 max-h-[480px] overflow-auto pr-1">
              {notes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No notes yet.</p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border bg-card p-3 group">
                  <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                    <button onClick={() => deleteNote(n.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      <Icon className="size-4 text-muted-foreground mt-0.5" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

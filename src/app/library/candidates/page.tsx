'use client';
import { Check, Inbox, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { Card, EmptyState, PageHeader } from '@/components/common/ui-bits';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { fmtDateTime } from '@/lib/clock';
import { can } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useLibrary, type Candidate } from '@/stores/storeLibrary';

export default function Candidates() {
  const lib = useLibrary();
  const [reject, setReject] = useState<string | null>(null);
  const [edit, setEdit] = useState<Candidate | null>(null);
  const [text, setText] = useState('');
  const writable = can('library', 'write:library');
  const order = { candidate: 0, approved: 1, rejected: 2 };
  const list = [...lib.candidates].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <div>
      <PageHeader eyebrow="Requirement Library" title="Candidate requirements" subtitle="Requirements proposed from uploads in model workspaces. Approved candidates become library requirements in the next library version." />
      {list.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" aria-hidden />} title="No candidates yet">
          In the 1st line Scoping stage, upload a requirement source (for example an ECB decision) and choose “Propose to library” for an extracted requirement.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <Card key={c.requirement.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-green-800">{c.requirement.id}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', c.status === 'candidate' ? 'bg-yellow-100 text-yellow-ink' : c.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-[#e8ebeb] text-ink-2')}>
                      {c.status === 'candidate' ? 'Candidate' : c.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink">{c.requirement.text}</p>
                  <p className="mt-1 text-xs text-ink-2">
                    Source: “{c.fromUpload}” · proposed by {c.proposedBy} for {c.fromModel} · {fmtDateTime(c.proposedAt)}
                  </p>
                  {c.rejectReason && <p className="mt-1 text-xs text-ink-2">Rejection reason: {c.rejectReason}</p>}
                </div>
                {c.status === 'candidate' && writable && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEdit(c);
                        setText(c.requirement.text);
                      }}
                    >
                      <Pencil aria-hidden /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReject(c.requirement.id)}>
                      <X aria-hidden /> Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        lib.approveCandidate(c.requirement.id);
                        toast.success(`${c.requirement.id} approved`, { description: 'Added to the library as a requirement.' });
                      }}
                    >
                      <Check aria-hidden /> Approve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <ReasonDialog
        open={!!reject}
        onOpenChange={(o) => !o && setReject(null)}
        title={`Reject ${reject}`}
        placeholder="e.g. Model-specific; not generalisable to other models"
        confirmLabel="Reject"
        onConfirm={(r) => reject && lib.rejectCandidate(reject, r)}
      />
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {edit?.requirement.id}</DialogTitle>
          </DialogHeader>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Requirement text" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              disabled={text.trim().length < 10}
              onClick={() => {
                if (edit) lib.editCandidate(edit.requirement.id, text.trim());
                setEdit(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

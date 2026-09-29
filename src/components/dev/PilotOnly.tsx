import { FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/ui-bits';

export function PilotOnly({ stage, modelId }: { stage: string; modelId: string }) {
  return (
    <EmptyState icon={<FlaskConical className="size-5" aria-hidden />} title={`${stage} — pilot only in this prototype`}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={`/dev/models/${modelId}/scope`}>Open Scoping for {modelId}</Link>
          </Button>
          <Button asChild>
            <Link href="/dev/models/MDL-01">Go to the pilot (MDL-01)</Link>
          </Button>
        </>
      }
    >
      The prototype implements the full workflow for the pilot scenario — the RDS documentation of PD-MORT-NL v4 (MDL-01). For other models, Scoping works end to end
      (requirement set, documents, uploads, locking); the later stages are shown for the pilot only.
    </EmptyState>
  );
}

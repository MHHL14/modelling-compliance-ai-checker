import { WorkspaceShell } from '@/components/shell/WorkspaceShell';
import { Seed2lod } from '@/components/val/Seed2lod';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceShell workspace="2lod">
      <Seed2lod />
      {children}
    </WorkspaceShell>
  );
}

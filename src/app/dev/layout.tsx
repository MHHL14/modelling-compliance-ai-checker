import { Seed1lod } from '@/components/dev/Seed1lod';
import { WorkspaceShell } from '@/components/shell/WorkspaceShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceShell workspace="1lod">
      <Seed1lod />
      {children}
    </WorkspaceShell>
  );
}

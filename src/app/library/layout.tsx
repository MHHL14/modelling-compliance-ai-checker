import { WorkspaceShell } from '@/components/shell/WorkspaceShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell workspace="library">{children}</WorkspaceShell>;
}

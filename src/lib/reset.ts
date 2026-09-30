'use client';
import { clearWorkspaceStorage } from './storage';

/** Clears all four partitioned stores and reloads seed data. */
export async function resetDemoData() {
  await clearWorkspaceStorage();
  window.location.href = '/';
}

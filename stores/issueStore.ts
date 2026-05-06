// src/stores/issueStore.ts
import { create } from "zustand";
import { Issue } from "@/types";
import { db } from "@/lib/db";

interface IssueStore {
  issues: Issue[];
  selectedIssue: Issue | null;
  isLoading: boolean;
  
  // Actions
  loadIssues: () => Promise<void>;
  addIssue: (issue: Issue) => Promise<void>;
  voteIssue: (issueId: string, deviceId: string) => Promise<void>;
  updateStatus: (issueId: string, status: Issue["status"]) => Promise<void>;
  setSelectedIssue: (issue: Issue | null) => void;
}

export const useIssueStore = create<IssueStore>((set, get) => ({
  issues: [],
  selectedIssue: null,
  isLoading: false,

  loadIssues: async () => {
    set({ isLoading: true });
    const issues = await db.issues.toArray();
    set({ issues, isLoading: false });
  },

  addIssue: async (issue) => {
    await db.issues.add(issue);
    const issues = await db.issues.toArray();
    set({ issues });
  },

  voteIssue: async (issueId, deviceId) => {
    const issue = await db.issues.get(issueId);
    if (issue && !issue.votedBy.includes(deviceId)) {
      issue.votes += 1;
      issue.votedBy.push(deviceId);
      await db.issues.put(issue);
      const issues = await db.issues.toArray();
      set({ issues });
    }
  },

  updateStatus: async (issueId, status) => {
    await db.issues.update(issueId, { status, updatedAt: new Date() });
    const issues = await db.issues.toArray();
    set({ issues });
  },

  setSelectedIssue: (issue) => set({ selectedIssue: issue }),
}));
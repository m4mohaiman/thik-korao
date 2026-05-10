"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client"; // ✅ ইম্পোর্ট

// ========== টাইপ ==========
export interface Issue {
  id: string;
  title: string;
  description: string;
  category: "road" | "electricity" | "water" | "garbage" | "drainage" | "other";
  images: string[];
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: "reported" | "acknowledged" | "in-progress" | "resolved" | "rejected";
  votes: number;
  voted_by: string[];
  created_by: string
  created_at: string;
  updated_at: string;
  comments: Comment[];
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
  } | null;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  text: string;
  is_official: boolean;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface IssueStore {
  issues: Issue[];
  selectedIssue: Issue | null;
  isLoading: boolean;

  loadIssues: () => Promise<void>;
  addIssue: (issue: any) => Promise<void>;
  voteIssue: (issueId: string, userId: string) => Promise<void>;
  updateStatus: (issueId: string, status: Issue["status"]) => Promise<void>;
  setSelectedIssue: (issue: Issue | null) => void;
  fetchIssueById: (id: string) => Promise<void>;
}

// ✅✅✅ এখানে supabase ক্লায়েন্ট ক্রিয়েট ✅✅✅
const supabase = createClient();

export const useIssueStore = create<IssueStore>((set, get) => ({
  issues: [],
  selectedIssue: null,
  isLoading: false,

  // ========== সব ইস্যু লোড ==========
loadIssues: async () => {
  set({ isLoading: true });

  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      profiles:created_by (
        full_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load issues error:", error);
    set({ isLoading: false });
    return;
  }

  set({
    issues: data || [],
    isLoading: false,
  });
},

  // ========== নতুন ইস্যু অ্যাড ==========
  addIssue: async (issue) => {
    const { error } = await supabase.from("issues").insert(issue);
    if (error) throw error;
    await get().loadIssues();
  },

  // ========== ভোট ==========
  voteIssue: async (issueId, userId) => {
    const issue = get().issues.find((i) => i.id === issueId);
    if (!issue || issue.voted_by.includes(userId)) return;

    const newvoted_by = [...issue.voted_by, userId];
    const newVotes = issue.votes + 1;

    set({
      issues: get().issues.map((i) =>
        i.id === issueId
          ? { ...i, votes: newVotes, voted_by: newvoted_by }
          : i
      ),
    });

    await supabase
      .from("issues")
      .update({ votes: newVotes, voted_by: newvoted_by })
      .eq("id", issueId);
  },

  // ========== স্ট্যাটাস আপডেট ==========
  updateStatus: async (issueId, status) => {
    set({
      issues: get().issues.map((i) =>
        i.id === issueId
          ? { ...i, status, updated_at: new Date().toISOString() }
          : i
      ),
      selectedIssue:
        get().selectedIssue?.id === issueId
          ? { ...get().selectedIssue!, status }
          : get().selectedIssue,
    });

    await supabase
      .from("issues")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", issueId);
  },

  // ========== সিলেক্টেড ইস্যু ==========
  setSelectedIssue: (issue) => set({ selectedIssue: issue }),

  // ========== ID দিয়ে ফেচ ==========
fetchIssueById: async (id) => {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      profiles:created_by (
        full_name,
        avatar_url,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Fetch issue error:", error);
    return;
  }

  console.log("Fetched issue with profile:", data); // ✅ চেক
  set({ selectedIssue: data as Issue });
},
}));
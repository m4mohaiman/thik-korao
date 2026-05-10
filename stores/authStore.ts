"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

// ========== টাইপ ==========
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  phone: string | null;
}

interface AuthStore {
  // State
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ========== Supabase ক্লায়েন্ট ==========
const supabase = createClient();

// ========== Store ==========
export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,

  // ========== Initialize (অ্যাপ লোডে চেক) ==========
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        set({
          user,
          profile: profile || null,
          isAdmin: profile?.role === "admin",
          isLoading: false,
        });
      } else {
        set({ user: null, profile: null, isAdmin: false, isLoading: false });
      }
    } catch (error) {
      console.error("Auth initialize error:", error);
      set({ user: null, profile: null, isAdmin: false, isLoading: false });
    }

    // Auth state change listener
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        set({
          user,
          profile: profile || null,
          isAdmin: profile?.role === "admin",
          isLoading: false,
        });
      } else {
        set({ user: null, profile: null, isAdmin: false, isLoading: false });
      }
    });
  },

  // ========== Sign Up ==========
  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
  },

  // ========== Sign In ==========
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      set({
        user: data.user,
        profile: profile || null,
        isAdmin: profile?.role === "admin",
      });
    }
  },

  // ========== Sign Out ==========
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null, isAdmin: false });
  },

  // ========== Refresh Profile ==========
  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    set({
      profile: profile || null,
      isAdmin: profile?.role === "admin",
    });
  },
}));
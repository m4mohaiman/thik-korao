// src/lib/sync.ts
import { db } from "./db";

export const syncIssues = async () => {
  if (!navigator.onLine) return;

  const pendingItems = await db.pendingSync.toArray();
  
  for (const item of pendingItems) {
    try {
      // এখানে আপনার ব্যাকেন্ড API কল হবে
      await fetch("/api/sync", {
        method: "POST",
        body: JSON.stringify(item),
        headers: { "Content-Type": "application/json" },
      });
      await db.pendingSync.delete(item.id);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
};

// Listen for online event
if (typeof window !== "undefined") {
  window.addEventListener("online", syncIssues);
}
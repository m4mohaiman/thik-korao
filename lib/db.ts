// src/lib/db.ts
import Dexie, { Table } from "dexie";
import { useIssueStore, type Issue } from "@/stores/issueStore";



class ThikKoraoDB extends Dexie {
  issues!: Table<Issue>;
  pendingSync!: Table<{ id: string; action: string; data: Issue; timestamp: number }>;

  constructor() {
    super("thikKoraoDB");
    this.version(1).stores({
      issues: "id, status, category, created_at, votes",
      pendingSync: "++id, timestamp",
    });
  }
}

export const db = new ThikKoraoDB();
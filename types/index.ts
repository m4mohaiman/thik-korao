// src/types/index.ts
export interface Issue {
  id: string;
  title: string;
  description: string;
  category: "road" | "electricity" | "water" | "garbage" | "drainage" | "other";
  images: string[]; // base64 for offline support
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: "reported" | "acknowledged" | "in-progress" | "resolved" | "rejected";
  votes: number;
  votedBy: string[]; // device IDs to prevent duplicate votes
  createdBy: string; // device ID
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  isOfficial: boolean; // government response
  createdAt: Date;
}
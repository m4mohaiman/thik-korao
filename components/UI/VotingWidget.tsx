"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { useIssueStore } from "@/stores/issueStore";

interface VotingWidgetProps {
  issueId: string;
  votes: number;
}

export default function VotingWidget({ issueId, votes }: VotingWidgetProps) {
  const { voteIssue } = useIssueStore();
  const [hasVoted, setHasVoted] = useState(false);
  const [currentVotes, setCurrentVotes] = useState(votes);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleVote = async () => {
    if (hasVoted) return;

    const deviceId = localStorage.getItem("deviceId") || "anonymous";

    setIsAnimating(true);
    setHasVoted(true);
    setCurrentVotes((prev) => prev + 1);

    await voteIssue(issueId, deviceId);

    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <button
      onClick={handleVote}
      disabled={hasVoted}
      className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all select-none ${
        hasVoted
          ? "bg-green-50 text-green-600 cursor-default"
          : "bg-gray-50 hover:bg-blue-50 hover:text-blue-600 cursor-pointer active:scale-95"
      }`}
      title={hasVoted ? "আপনি ভোট দিয়েছেন" : "সমর্থন জানান"}
    >
      <ChevronUp
        className={`w-5 h-5 transition-transform ${
          isAnimating ? "-translate-y-1 scale-125" : ""
        } ${hasVoted ? "text-green-500" : ""}`}
      />
      <span className="font-bold text-lg leading-tight">{currentVotes}</span>
      <span className="text-[10px] text-gray-400">
        {hasVoted ? "ভোট দিয়েছেন" : "সমর্থন"}
      </span>
    </button>
  );
}
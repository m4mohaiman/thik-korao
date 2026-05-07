// src/components/Issue/IssueCard.tsx
import { Issue } from "@/types";
import VotingWidget from "../UI/VotingWidget";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import Image from "next/image";

export default function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex gap-4">
        <VotingWidget issueId={issue.id} votes={issue.votes} />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{issue.title}</h3>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{issue.description}</p>
          
          {issue.images[0] && (
            <Image
                width={300}
                height={300}
              src={issue.images[0]}
              alt={issue.title}
              className="mt-3 rounded-lg h-32 w-full object-cover"
            />
          )}
          
          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              {getStatusText(issue.status)}
            </span>
            <span>
              {formatDistanceToNow(new Date(issue.created_at), { locale: bn, addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    reported: "জমা পড়েছে",
    acknowledged: "গৃহীত হয়েছে",
    "in-progress": "কাজ চলছে",
    resolved: "সমাধান হয়েছে",
    rejected: "গ্রহণযোগ্য নয়",
  };
  return map[status] || status;
}
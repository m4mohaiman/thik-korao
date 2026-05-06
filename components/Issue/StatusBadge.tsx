import { Clock, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "lg";
}

const statusConfig: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  reported: {
    label: "জমা পড়েছে",
    icon: Clock,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  acknowledged: {
    label: "গৃহীত হয়েছে",
    icon: AlertCircle,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "in-progress": {
    label: "কাজ চলছে",
    icon: Loader2,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  resolved: {
    label: "সমাধান",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "গ্রহণযোগ্য নয়",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.reported;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${
        config.className
      } ${
        size === "lg"
          ? "px-3 py-1.5 text-sm"
          : "px-2 py-0.5 text-xs"
      }`}
    >
      <Icon
        className={`${
          size === "lg" ? "w-4 h-4" : "w-3 h-3"
        } ${status === "in-progress" ? "animate-spin" : ""}`}
      />
      {config.label}
    </span>
  );
}
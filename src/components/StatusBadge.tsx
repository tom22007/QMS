interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const colorMap: Record<string, string> = {
  "Signed": "bg-green/10 text-green border-green/20",
  "Complete": "bg-green/10 text-green border-green/20",
  "Closed": "bg-green/10 text-green border-green/20",
  "Done": "bg-green/10 text-green border-green/20",
  "Executed": "bg-green/10 text-green border-green/20",
  "Needs signature": "bg-accent/10 text-accent border-accent/20",
  "Needed": "bg-accent/10 text-accent border-accent/20",
  "In progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Pending": "bg-amber-50 text-amber-700 border-amber-200",
  "Scheduled": "bg-purple-50 text-purple-700 border-purple-200",
  "Open": "bg-accent/10 text-accent border-accent/20",
  "Draft": "bg-gray-100 text-gray-600 border-gray-200",
  "Template": "bg-gray-100 text-gray-500 border-gray-200",
  "Active": "bg-blue-50 text-blue-700 border-blue-200",
  "No tags": "bg-gray-100 text-gray-500 border-gray-200",
  "N/A": "bg-gray-100 text-gray-400 border-gray-200",
  "Not required": "bg-gray-100 text-gray-400 border-gray-200",
  "Routed": "bg-blue-50 text-blue-700 border-blue-200",
  "Approved": "bg-green/10 text-green border-green/20",
  "High": "bg-red-50 text-red-700 border-red-200",
  "Medium": "bg-amber-50 text-amber-700 border-amber-200",
  "Low": "bg-green-50 text-green-700 border-green-200",
  "Minor": "bg-amber-50 text-amber-700 border-amber-200",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const colors = colorMap[status] || "bg-gray-100 text-gray-600 border-gray-200";
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colors} ${sizeClass}`}>
      {status}
    </span>
  );
}

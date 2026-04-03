interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "navy" | "green" | "accent" | "blue";
  icon?: React.ReactNode;
}

const borderColors = {
  navy: "border-l-navy",
  green: "border-l-green",
  accent: "border-l-accent",
  blue: "border-l-blue-500",
};

export default function MetricCard({ title, value, subtitle, color = "navy", icon }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColors[color]} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-med">{title}</p>
          <p className="text-3xl font-bold text-text-dark mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-med mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-text-med/40">{icon}</div>}
      </div>
    </div>
  );
}

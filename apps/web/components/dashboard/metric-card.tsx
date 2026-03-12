import { Card } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card tone="soft" className="p-5">
      <div className="label-caps text-moss/78">{label}</div>
      <div className="mt-4 text-4xl text-dusk">{value}</div>
      <p className="mt-3 body-copy">{hint}</p>
    </Card>
  );
}

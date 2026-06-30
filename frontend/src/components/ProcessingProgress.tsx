import { Spinner } from "@/components/ui/spinner";
import type { TaskStatus } from "@/utils/api";
import { formatKeyLabel } from "@/utils/utils";

interface Props {
  task: TaskStatus | null;
}

function getMessage(task: TaskStatus | null): string {
  if (!task) return "Submitting job...";

  if (task.status === "PENDING") {
    if (task.queue?.position == null) return "Waiting in queue...";
    return `Queue position ${task.queue.position} of ${task.queue.length}`;
  }

  if (task.status === "PROGRESS") {
    const p = task.progress;
    if (!p?.stage) return "Processing...";
    if (p.stage === "parsing") return "Parsing network file...";

    const metricPart = p.metric
      ? `${formatKeyLabel(p.metric)}${p.metric_index != null && p.metric_total != null ? ` (${p.metric_index}/${p.metric_total})` : ""}`
      : "metrics";
    const timestepPart =
      p.timestep_index != null &&
      p.timestep_total != null &&
      p.timestep_total > 1
        ? ` - timestep ${p.timestep_index}/${p.timestep_total}`
        : "";

    return `Calculating ${metricPart}${timestepPart}`;
  }

  return "Processing...";
}

export function ProcessingProgress({ task }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <Spinner className="size-10" />
      <p className="text-center text-sm text-muted-foreground">
        {getMessage(task)}
      </p>
    </div>
  );
}

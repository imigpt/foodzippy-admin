import { cn } from '@/lib/utils';

type Status = 'pending' | 'publish' | 'reject';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusStyles: Record<Status, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  publish: 'bg-success/15 text-success border-success/30',
  reject: 'bg-destructive/15 text-destructive border-destructive/30',
};

const statusLabels: Record<Status, string> = {
  pending: 'Pending',
  publish: 'Published',
  reject: 'Rejected',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

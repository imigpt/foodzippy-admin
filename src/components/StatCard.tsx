import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary/15 border-primary/30',
  success: 'bg-success/15 border-success/30',
  warning: 'bg-warning/15 border-warning/30',
  destructive: 'bg-destructive/15 border-destructive/30',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  destructive: 'bg-destructive/20 text-destructive',
};

export function StatCard({ title, value, icon: Icon, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn('p-6 pb-8 rounded-xl border', variantStyles[variant])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={cn('w-16 h-16 rounded-lg flex items-center justify-center', iconStyles[variant])}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

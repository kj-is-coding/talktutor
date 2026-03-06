import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('skeleton rounded-md animate-pulse bg-muted', className)} {...props} />
  );
}

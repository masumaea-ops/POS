import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface IconProps extends Omit<LucideProps, 'size'> {
  name?: keyof typeof LucideIcons | string;
  icon?: React.ComponentType<LucideProps>;
  size?: IconSize;
  title?: string;
  className?: string;
}

const sizeMap: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * Standardized Lucide Icon Component
 * Enforces unified sizing, default stroke widths, light/dark mode support, and accessibility.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  icon: CustomIcon,
  size = 'md',
  strokeWidth = 2,
  title,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const numericSize = typeof size === 'number' ? size : sizeMap[size] || 20;

  let ResolvedIcon: React.ComponentType<LucideProps> | null = CustomIcon || null;

  if (!ResolvedIcon && name) {
    const matched = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[name];
    if (matched) {
      ResolvedIcon = matched;
    }
  }

  if (!ResolvedIcon) {
    ResolvedIcon = LucideIcons.HelpCircle;
  }

  return (
    <ResolvedIcon
      size={numericSize}
      strokeWidth={strokeWidth}
      className={`shrink-0 transition-colors ${className}`}
      aria-hidden={!title && !ariaLabel}
      aria-label={ariaLabel || title}
      title={title}
      {...props}
    />
  );
};

/**
 * Semantic Helper Icons for standardized badge & status indicators
 */
export const StatusBadgeIcon: React.FC<{ status: string; size?: IconSize; className?: string }> = ({ status, size = 'xs', className = '' }) => {
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('completed') || s.includes('paid') || s.includes('approved') || s.includes('invoiced')) {
    return <Icon icon={LucideIcons.CheckCircle2} size={size} className={`text-emerald-500 ${className}`} />;
  }
  if (s.includes('pending') || s.includes('waiting') || s.includes('in progress') || s.includes('scheduled')) {
    return <Icon icon={LucideIcons.Clock} size={size} className={`text-amber-500 ${className}`} />;
  }
  if (s.includes('alert') || s.includes('critical') || s.includes('cancelled') || s.includes('overdue') || s.includes('failed')) {
    return <Icon icon={LucideIcons.AlertTriangle} size={size} className={`text-rose-500 ${className}`} />;
  }
  return <Icon icon={LucideIcons.Info} size={size} className={`text-blue-500 ${className}`} />;
};

export const LocationBadgeIcon: React.FC<{ size?: IconSize; className?: string }> = ({ size = 'xs', className = '' }) => (
  <Icon icon={LucideIcons.Building2} size={size} className={`text-brand-orange ${className}`} />
);

export const RoleBadgeIcon: React.FC<{ size?: IconSize; className?: string }> = ({ size = 'xs', className = '' }) => (
  <Icon icon={LucideIcons.ShieldCheck} size={size} className={`text-purple-600 dark:text-purple-400 ${className}`} />
);

export default Icon;

import React from 'react';
import { Badge } from './badge';

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  let variant: 'neutral' | 'success' | 'warning' | 'error' | 'info' = 'neutral';

  if (['ACTIVE', 'APPROVED', 'CLEAN', 'COMPLETED', 'SUCCESS'].includes(normalized)) {
    variant = 'success';
  } else if (['PENDING', 'UNDER_REVIEW', 'DRAFT', 'SUBMITTED'].includes(normalized)) {
    variant = 'warning';
  } else if (['REJECTED', 'SUSPENDED', 'INFECTED', 'INACTIVE', 'FAILED'].includes(normalized)) {
    variant = 'error';
  } else if (['IN_PROGRESS', 'SHARED'].includes(normalized)) {
    variant = 'info';
  }

  return <Badge variant={variant}>{status}</Badge>;
};

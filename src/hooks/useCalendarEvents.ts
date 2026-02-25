import { useMemo } from 'react';
import type { EventInput } from '@fullcalendar/core';
import type { Deal } from '../types';
import { STATUS_COLORS, STATUS_LABELS, SETTLEMENT_LABELS } from '../utils/constants';

export function useCalendarEvents(deals: Deal[]): EventInput[] {
  return useMemo(() =>
    deals.map((deal) => ({
      id: deal.id,
      title: `${deal.customerName}`,
      start: `${deal.visitDate}T${deal.visitTime}`,
      backgroundColor: STATUS_COLORS[deal.status],
      borderColor: STATUS_COLORS[deal.status],
      extendedProps: {
        deal,
        statusLabel: STATUS_LABELS[deal.status],
        settlementLabel: SETTLEMENT_LABELS[deal.settlement],
      },
    })),
    [deals]
  );
}

import { useMemo } from 'react';
import type { EventInput } from '@fullcalendar/core';
import type { Deal } from '../types';
import { STATUS_COLORS, RESULT_COLORS, STATUS_LABELS, SETTLEMENT_LABELS } from '../utils/constants';

export function useCalendarEvents(deals: Deal[]): EventInput[] {
  return useMemo(() =>
    deals.map((deal) => {
      const isWon = deal.result === 'won';
      const color = isWon ? RESULT_COLORS.won : STATUS_COLORS[deal.status];
      return {
        id: deal.id,
        title: `${deal.customerName}`,
        start: `${deal.visitDate}T${deal.visitTime}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          deal,
          statusLabel: STATUS_LABELS[deal.status],
          settlementLabel: SETTLEMENT_LABELS[deal.settlement],
        },
      };
    }),
    [deals]
  );
}

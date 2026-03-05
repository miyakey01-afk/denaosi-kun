import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import type { EventInput } from '@fullcalendar/core';
import type { Deal } from '../../types';
import { STATUS_LABELS, SETTLEMENT_LABELS, RESULT_LABELS } from '../../utils/constants';

interface CalendarViewProps {
  events: EventInput[];
  onEventClick: (deal: Deal) => void;
  onEventDrop: (dealId: string, newDate: string) => void;
  onDateSelect: (date: string, time: string) => void;
}

function renderEventContent(eventInfo: EventContentArg) {
  const deal = eventInfo.event.extendedProps.deal as Deal;
  const timeText = eventInfo.timeText;

  return (
    <div className="px-1 py-0.5 text-xs leading-tight overflow-hidden cursor-pointer">
      <div className="font-semibold truncate">
        {timeText && <span>{timeText} </span>}
        {deal.customerName}
      </div>
      <div className="truncate opacity-80">
        {deal.property} | {deal.expectedPoints}pt
      </div>
      <div className="flex gap-1 mt-0.5 flex-wrap">
        <span className="bg-white/30 rounded px-1 text-[10px]">
          {STATUS_LABELS[deal.status]}
        </span>
        <span className="bg-white/30 rounded px-1 text-[10px]">
          {SETTLEMENT_LABELS[deal.settlement]}
        </span>
        <span className={`rounded px-1 text-[10px] ${deal.result === 'won' ? 'bg-white/60 font-bold' : 'bg-white/30'}`}>
          {RESULT_LABELS[deal.result]}
        </span>
      </div>
    </div>
  );
}

export default function CalendarView({
  events,
  onEventClick,
  onEventDrop,
  onDateSelect,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const handleEventClick = (info: EventClickArg) => {
    const deal = info.event.extendedProps.deal as Deal;
    onEventClick(deal);
  };

  const handleEventDrop = (info: EventDropArg) => {
    const newStart = info.event.start;
    if (!newStart) return;
    const yyyy = newStart.getFullYear();
    const mm = String(newStart.getMonth() + 1).padStart(2, '0');
    const dd = String(newStart.getDate()).padStart(2, '0');
    onEventDrop(info.event.id, `${yyyy}-${mm}-${dd}`);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    const date = info.startStr.split('T')[0];
    const time = info.startStr.includes('T')
      ? info.startStr.split('T')[1].slice(0, 5)
      : '09:00';
    onDateSelect(date, time);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ja"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{
          today: '今日',
          month: '月',
          week: '週',
          day: '日',
        }}
        events={events}
        eventContent={renderEventContent}
        editable={true}
        selectable={true}
        selectMirror={true}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        select={handleDateSelect}
        height="auto"
        dayMaxEvents={3}
        eventDisplay="block"
      />
    </div>
  );
}

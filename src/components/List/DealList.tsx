import type { Deal } from '../../types';
import { STATUS_LABELS, SETTLEMENT_LABELS, RESULT_LABELS, STATUS_COLORS } from '../../utils/constants';

interface DealListProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onDealDelete: (id: string) => void;
}

export default function DealList({ deals, onDealClick, onDealDelete }: DealListProps) {
  const sorted = [...deals].sort((a, b) => a.visitDate.localeCompare(b.visitDate));

  const handleDelete = (e: React.MouseEvent, deal: Deal) => {
    e.stopPropagation();
    if (confirm(`「${deal.customerName}」の案件を削除しますか？`)) {
      onDealDelete(deal.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left font-medium text-gray-600">訪問日</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">時間</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">担当者</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">所属</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">顧客名</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">提案物件</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">ポイント</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状態</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">決済</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">結果</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((deal) => (
              <tr
                key={deal.id}
                onClick={() => onDealClick(deal)}
                className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">{deal.visitDate}</td>
                <td className="px-4 py-3">{deal.visitTime}</td>
                <td className="px-4 py-3">{deal.salesPerson}</td>
                <td className="px-4 py-3">{deal.department}</td>
                <td className="px-4 py-3 font-medium">{deal.customerName}</td>
                <td className="px-4 py-3">{deal.property}</td>
                <td className="px-4 py-3 text-right font-medium">{deal.expectedPoints}pt</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs text-white font-medium"
                    style={{ backgroundColor: STATUS_COLORS[deal.status] }}
                  >
                    {STATUS_LABELS[deal.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{SETTLEMENT_LABELS[deal.settlement]}</td>
                <td className="px-4 py-3 text-xs">{RESULT_LABELS[deal.result]}</td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={(e) => handleDelete(e, deal)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                  案件がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

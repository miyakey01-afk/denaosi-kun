import type { Deal } from '../../types';
import { STATUS_LABELS, SETTLEMENT_LABELS, RESULT_LABELS, STATUS_COLORS } from '../../utils/constants';

interface DealListProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export default function DealList({ deals, onDealClick }: DealListProps) {
  const sorted = [...deals].sort((a, b) => a.visitDate.localeCompare(b.visitDate));

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
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
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

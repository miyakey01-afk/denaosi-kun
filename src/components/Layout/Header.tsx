interface HeaderProps {
  onNewDeal: () => void;
}

export default function Header({ onNewDeal }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800">
          出直しくん
        </h1>
        <span className="text-sm text-gray-500 hidden sm:inline">
          営業パイプライン管理
        </span>
      </div>
      <button
        onClick={onNewDeal}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        + 新規案件
      </button>
    </header>
  );
}

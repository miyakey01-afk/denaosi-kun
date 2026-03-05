import { useState } from 'react';
import type { Office, StaffMember } from '../../types';
import { useOffices } from '../../hooks/useOffices';

interface AdminPageProps {
  onLogout: () => void;
}

export default function AdminPage({ onLogout }: AdminPageProps) {
  const { offices, adminPasscode, loading, addOffice, updateOffice, deleteOffice, updateAdminPasscode } = useOffices();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAdminPasscodeEdit, setShowAdminPasscodeEdit] = useState(false);
  const [newAdminPasscode, setNewAdminPasscode] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  const handleSaveAdminPasscode = async () => {
    if (newAdminPasscode.trim()) {
      await updateAdminPasscode(newAdminPasscode.trim());
      setNewAdminPasscode('');
      setShowAdminPasscodeEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">出直しくん - 管理画面</h1>
          <p className="text-xs text-gray-500">営業所の追加・編集・パスコード管理</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ログアウト
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* 管理者パスコード */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">管理者パスコード</h2>
          {showAdminPasscodeEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAdminPasscode}
                onChange={(e) => setNewAdminPasscode(e.target.value)}
                placeholder="新しい管理者パスコード"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSaveAdminPasscode} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">保存</button>
              <button onClick={() => setShowAdminPasscodeEdit(false)} className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">キャンセル</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <code className="bg-gray-100 px-3 py-1.5 rounded text-sm">{adminPasscode}</code>
              <button onClick={() => { setShowAdminPasscodeEdit(true); setNewAdminPasscode(adminPasscode); }} className="text-sm text-blue-600 hover:text-blue-800">変更</button>
            </div>
          )}
        </div>

        {/* 営業所一覧 */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">営業所一覧（{offices.length}件）</h2>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + 営業所を追加
            </button>
          </div>

          {showNewForm && (
            <OfficeForm
              onSave={async (data) => { await addOffice(data); setShowNewForm(false); }}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          <div className="space-y-3">
            {offices.map((office) => (
              <div key={office.id} className="border border-gray-200 rounded-lg p-4">
                {editingId === office.id ? (
                  <OfficeForm
                    initial={office}
                    onSave={async (data) => { await updateOffice(office.id, data); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{office.name}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(office.id)} className="text-sm text-blue-600 hover:text-blue-800">編集</button>
                        <button
                          onClick={async () => {
                            if (confirm(`「${office.name}」を削除しますか？`)) {
                              await deleteOffice(office.id);
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>パスコード: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{office.passcode}</code></p>
                      <p>所属課: {office.departments.length}件</p>
                      <p>スタッフ: {office.staffMembers.length}名</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 営業所 編集/新規 フォーム ── */

interface OfficeFormProps {
  initial?: Office;
  onSave: (data: Omit<Office, 'id'>) => Promise<void>;
  onCancel: () => void;
}

function OfficeForm({ initial, onSave, onCancel }: OfficeFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [passcode, setPasscode] = useState(initial?.passcode || '');
  const [deptText, setDeptText] = useState((initial?.departments || []).join('\n'));
  const [staffText, setStaffText] = useState(
    (initial?.staffMembers || []).map((s) => `${s.employeeId},${s.name},${s.department}`).join('\n'),
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !passcode.trim()) return;
    setSaving(true);

    const departments = deptText.split('\n').map((s) => s.trim()).filter(Boolean);
    const staffMembers: StaffMember[] = staffText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',');
        return {
          employeeId: Number(parts[0]) || 0,
          name: parts[1]?.trim() || '',
          department: parts[2]?.trim() || '',
        };
      })
      .filter((s) => s.name);

    await onSave({ name: name.trim(), passcode: passcode.trim(), departments, staffMembers });
    setSaving(false);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">営業所名 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 城西支社 渋谷エリア"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">パスコード *</label>
          <input
            type="text"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="例: Shibuya2026"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          所属課（1行に1つ）
        </label>
        <textarea
          value={deptText}
          onChange={(e) => setDeptText(e.target.value)}
          rows={4}
          placeholder={"所付け\n1-1.遠藤課\n1-2.鈴木智課"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          スタッフ（CSV: 社員番号,氏名,所属課 / 1行に1人）
        </label>
        <textarea
          value={staffText}
          onChange={(e) => setStaffText(e.target.value)}
          rows={6}
          placeholder={"100,山田 将祐,所付け\n3107,遠藤 悠大,1-1.遠藤課"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">キャンセル</button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !passcode.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

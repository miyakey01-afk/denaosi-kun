import type { StaffMember } from '../types';

/**
 * 2026年3月 所属マスター（Excelから転記）
 * 城西支社 渋谷エリア
 */
export const STAFF_MASTER: StaffMember[] = [
  // ── 城西支社（所付け / 山田直轄）──
  { employeeId: 100, name: '山田 将祐', department: '所付け' },
  { employeeId: 271, name: '飯田 聡博', department: '所付け' },
  { employeeId: 978, name: '田之倉 淳', department: '所付け' },
  { employeeId: 1963, name: '鶴澤 政樹', department: '所付け' },
  { employeeId: 3054, name: '大瀧 将志', department: '所付け' },
  { employeeId: 3601, name: '横山 果穂', department: '所付け' },
  { employeeId: 3638, name: '正木 太悟', department: '所付け' },
  { employeeId: 3807, name: '星 駿斗', department: '所付け' },
  { employeeId: 4012, name: '米倉 佑一', department: '所付け' },
  { employeeId: 4218, name: '藤波 昂', department: '所付け' },
  { employeeId: 4228, name: '味岡 莉央', department: '所付け' },
  { employeeId: 4556, name: '佐藤 名月子', department: '所付け' },

  // ── 城西支社渋谷第1営業所（小林直轄）──
  { employeeId: 856, name: '小林 土見', department: '小林直轄' },
  { employeeId: 1222, name: '廣田 隆', department: '小林直轄' },

  // ── 渋谷第1営業所 第1課（1-1.遠藤課）──
  { employeeId: 3107, name: '遠藤 悠大', department: '1-1.遠藤課' },
  { employeeId: 3995, name: '吉澤 大地', department: '1-1.遠藤課' },
  { employeeId: 4554, name: '坂上 真啓', department: '1-1.遠藤課' },
  { employeeId: 4555, name: '坂本 草楠', department: '1-1.遠藤課' },
  { employeeId: 4919, name: '川本 大貴', department: '1-1.遠藤課' },

  // ── 渋谷第1営業所 第2課（1-2.鈴木智課）──
  { employeeId: 3100, name: '鈴木 智仁', department: '1-2.鈴木智課' },
  { employeeId: 4235, name: '西谷 陸斗', department: '1-2.鈴木智課' },
  { employeeId: 4552, name: '上原 基', department: '1-2.鈴木智課' },
  { employeeId: 4917, name: '五十川 健太', department: '1-2.鈴木智課' },

  // ── 渋谷第1営業所 第3課（1-3.天野課）──
  { employeeId: 3091, name: '天野 一歩', department: '1-3.天野課' },
  { employeeId: 3235, name: '内田 亮次', department: '1-3.天野課' },
  { employeeId: 4559, name: '山本 蓮', department: '1-3.天野課' },
  { employeeId: 4929, name: '渡邊 尽', department: '1-3.天野課' },

  // ── 渋谷第1営業所 第4課（1-4.佐藤直課）──
  { employeeId: 3223, name: '佐藤 直樹', department: '1-4.佐藤直課' },
  { employeeId: 3822, name: '佐藤 雅', department: '1-4.佐藤直課' },
  { employeeId: 5186, name: '友常 健介', department: '1-4.佐藤直課' },

  // ── 渋谷第1営業所 第5課（1-5.佐藤智課）──
  { employeeId: 2694, name: '佐藤 智克', department: '1-5.佐藤智課' },
  { employeeId: 4234, name: '杉田 幸祐', department: '1-5.佐藤智課' },
  { employeeId: 4926, name: '出川 菜大', department: '1-5.佐藤智課' },

  // ── 渋谷第1営業所 第6課（1-6.久保田課）──
  { employeeId: 3359, name: '久保田 慎平', department: '1-6.久保田課' },
  { employeeId: 239, name: '矢澤 高史', department: '1-6.久保田課' },
  { employeeId: 4928, name: '山本 晃生', department: '1-6.久保田課' },

  // ── 城西支社渋谷第2営業所（鈴木直轄）──
  { employeeId: 3093, name: '鈴木 孝也', department: '鈴木直轄' },

  // ── 渋谷第2営業所 第1統括（桐生統括）──
  { employeeId: 2664, name: '桐生 昭宏', department: '桐生統括' },
  { employeeId: 870, name: '遠藤 剛', department: '所付け' },

  // ── 渋谷第2営業所 第1統括 第1課（2-1.鈴木悠課）──
  { employeeId: 3824, name: '鈴木 悠介', department: '2-1.鈴木悠課' },
  { employeeId: 3991, name: '稲崎 葵真', department: '2-1.鈴木悠課' },
  { employeeId: 4233, name: '坂本 駿', department: '2-1.鈴木悠課' },
  { employeeId: 4921, name: '工藤 七海', department: '2-1.鈴木悠課' },
  { employeeId: 5124, name: '竹林 尚大', department: '2-1.鈴木悠課' },

  // ── 渋谷第2営業所 第1統括 第2課（2-2.山本課）──
  { employeeId: 3469, name: '山本 一真', department: '2-2.山本課' },
  { employeeId: 829, name: '星野 武史', department: '2-2.山本課' },
  { employeeId: 3465, name: '小島 優作', department: '2-2.山本課' },
  { employeeId: 4922, name: '榊原 穂香', department: '2-2.山本課' },
  { employeeId: 4925, name: '只野 博', department: '2-2.山本課' },

  // ── 渋谷第2営業所 第1統括 第3課（2-3.金成課）──
  { employeeId: 3820, name: '金成 明朝', department: '2-3.金成課' },
  { employeeId: 3827, name: '宮元 伶', department: '2-3.金成課' },
  { employeeId: 4923, name: '柴崎 瑞暉', department: '2-3.金成課' },
];

/** マスターから課の一覧を重複なしで抽出 */
export const STAFF_DEPARTMENTS: string[] = [
  ...new Set(STAFF_MASTER.map((s) => s.department)),
];

/** マスターから氏名の一覧を抽出 */
export const STAFF_NAMES: string[] = STAFF_MASTER.map((s) => s.name);

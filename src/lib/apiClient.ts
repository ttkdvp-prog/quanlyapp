import type { App, ParsedApp } from "../types";

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

type Envelope<T> = {
  ok: boolean;
  data: T;
  error: string | null;
  version?: number;
  total?: number;
};

async function call<T>(
  method: "GET" | "POST",
  payload: Record<string, unknown>
): Promise<Envelope<T>> {
  const body = { ...payload, apiKey: API_KEY };

  // Demo mode: if no script URL configured, return mock data
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR")) {
    return getMockData<T>(payload) as Envelope<T>;
  }

  let res: Response;
  if (method === "GET") {
    const params = new URLSearchParams();
    Object.entries(body).forEach(([k, v]) => {
      if (v == null) return;
      params.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    });
    res = await fetch(`${SCRIPT_URL}?${params.toString()}`, { method: "GET" });
  } else {
    res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
  }

  const json = (await res.json()) as Envelope<T>;
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json;
}

export const api = {
  list: <T>(
    table: string,
    args: { q?: string; sort?: string; offset?: number; limit?: number; category?: string } = {}
  ) => call<T[]>("GET", { action: "list", table, ...args }),

  get: <T>(table: string, id: string) =>
    call<T>("GET", { action: "get", table, id }),

  create: <T>(table: string, data: Partial<T>) =>
    call<T>("POST", { action: "create", table, data }),

  update: <T>(table: string, id: string, data: Partial<T>) =>
    call<T>("POST", { action: "update", table, id, data }),

  remove: (table: string, id: string) =>
    call<{ id: string; deleted: true }>("POST", { action: "delete", table, id }),

  delete: (table: string, id: string) =>
    call<{ id: string; deleted: true }>("POST", { action: "delete", table, id }),

  stream: <T>(table: string, since: number) =>
    call<T[]>("GET", { action: "stream", table, since }),
};

// ─── Parse helpers ───────────────────────────────────────────────────────────

export function parseApp(raw: App): ParsedApp {
  let links = [];
  if (raw.links) {
    try {
      links = typeof raw.links === "string" ? JSON.parse(raw.links) : raw.links;
    } catch {
      links = [];
    }
  }
  return { ...raw, links };
}

// ─── Mock data for demo when Apps Script not configured ──────────────────────

function getMockData<T>(payload: Record<string, unknown>): Envelope<T> {
  const table = payload.table as string;
  const q = (payload.q as string || "").toLowerCase();

  if (table === "apps") {
    let apps = MOCK_APPS;
    if (q) {
      apps = apps.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    if (payload.action === "stream") {
      const since = Number(payload.since || 0);
      return { ok: true, data: [] as unknown as T, error: null, version: since };
    }
    return { ok: true, data: apps as unknown as T, error: null, version: 1, total: apps.length };
  }

  if (table === "users") {
    return { ok: true, data: MOCK_USERS as unknown as T, error: null, version: 1, total: MOCK_USERS.length };
  }

  return { ok: true, data: [] as unknown as T, error: null, version: 1 };
}

const MOCK_APPS: App[] = [
  // KẾ TOÁN
  {
    id: "1", name: "Báo cáo Thu Chi", description: "Quản lý thu chi và dòng tiền hàng tháng",
    category: "KẾ TOÁN", icon: "📊", url: "#", links: "[]",
    access_role: "finance", status: "active", order: 1,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "2", name: "Bảng tính lương", description: "Bảng tính lương và hoa hồng nhân viên",
    category: "KẾ TOÁN", icon: "💰", url: "#", links: "[]",
    access_role: "finance", status: "active", order: 2,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "3", name: "Quỹ nội bộ", description: "Theo dõi quỹ nội bộ và các khoản chi tiêu",
    category: "KẾ TOÁN", icon: "🏦", url: "#", links: "[]",
    access_role: "finance", status: "active", order: 3,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "4", name: "Hóa đơn điện tử", description: "Hệ thống xuất và theo dõi hóa đơn điện tử",
    category: "KẾ TOÁN", icon: "🧾", url: "#", links: "[]",
    access_role: "finance", status: "active", order: 4,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "5", name: "Khấu hao tài sản", description: "Quản lý tỷ lệ khấu hao tài sản cố định",
    category: "KẾ TOÁN", icon: "🏗️", url: "#", links: "[]",
    access_role: "finance", status: "active", order: 5,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "6", name: "Báo giá tự động", description: "Công cụ tự động tạo file báo giá",
    category: "KẾ TOÁN", icon: "📄", url: "#", links: "[]",
    access_role: "all", status: "active", order: 6,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "7", name: "Theo dõi Đơn hàng", description: "Cập nhật trạng thái và tiến độ đơn hàng",
    category: "KẾ TOÁN", icon: "📦", url: "#", links: "[]",
    access_role: "all", status: "active", order: 7,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "8", name: "Doanh thu Đại lý", description: "Thống kê doanh số theo từng đại lý",
    category: "KẾ TOÁN", icon: "📈", url: "#", links: "[]",
    access_role: "finance", status: "active", order: 8,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "9", name: "Kho hàng tổng", description: "Quản lý xuất nhập tồn và đối soát kho",
    category: "KẾ TOÁN", icon: "🏪", url: "#", links: "[]",
    access_role: "all", status: "active", order: 9,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  // MARKETING
  {
    id: "10", name: "CRM Khách hàng", description: "Quản lý tập khách hàng và tiếp thị",
    category: "MARKETING", icon: "👥", url: "#", links: "[]",
    access_role: "marketing", status: "active", order: 1,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "11", name: "Kế hoạch Content", description: "Lịch trình đăng bài Fanpage và website",
    category: "MARKETING", icon: "📝", url: "#", links: "[]",
    access_role: "marketing", status: "active", order: 2,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "12", name: "Ngân sách Ads", description: "Thống kê chi tiêu Facebook Ads, Google Ads",
    category: "MARKETING", icon: "💸", url: "#", links: "[]",
    access_role: "marketing", status: "active", order: 3,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "13", name: "Thống kê Traffic", description: "Phân tích lưu lượng truy cập trang web",
    category: "MARKETING", icon: "📡", url: "#", links: "[]",
    access_role: "marketing", status: "active", order: 4,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "14", name: "Kho Tài nguyên số", description: "Drive chia sẻ hình ảnh, video, banner",
    category: "MARKETING", icon: "🗂️", url: "#", links: "[]",
    access_role: "all", status: "active", order: 5,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "15", name: "Quản lý Sự kiện", description: "Lên kế hoạch và theo dõi đầu việc sự kiện",
    category: "MARKETING", icon: "🎪", url: "#", links: "[]",
    access_role: "marketing", status: "active", order: 6,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  // NHÂN SỰ
  {
    id: "16", name: "Quản lý Tuyển dụng", description: "Theo dõi hồ sơ ứng viên và lịch phỏng vấn",
    category: "NHÂN SỰ", icon: "🎯", url: "#", links: "[]",
    access_role: "hr", status: "active", order: 1,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "17", name: "Chấm công ngày", description: "Hệ thống check-in/out và quản lý giờ làm",
    category: "NHÂN SỰ", icon: "⏰", url: "#", links: "[]",
    access_role: "all", status: "active", order: 2,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "18", name: "Hồ sơ Nhân sự", description: "Lưu trữ Database hợp đồng, giấy tờ nhân viên",
    category: "NHÂN SỰ", icon: "📋", url: "#", links: "[]",
    access_role: "hr", status: "active", order: 3,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "19", name: "Đánh giá KPI", description: "Bảng tiêu chí đánh giá năng lực nhân viên",
    category: "NHÂN SỰ", icon: "🏆", url: "#", links: "[]",
    access_role: "hr", status: "active", order: 4,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "20", name: "Đào tạo nội bộ", description: "Thư viện tài liệu và các khóa học nội bộ",
    category: "NHÂN SỰ", icon: "📚", url: "#", links: "[]",
    access_role: "all", status: "active", order: 5,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  // TIỆN ÍCH
  {
    id: "21", name: "Đặt phòng họp", description: "Lịch đăng ký và sử dụng các phòng họp",
    category: "TIỆN ÍCH", icon: "🏢", url: "#", links: "[]",
    access_role: "all", status: "active", order: 1,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "22", name: "Xin cấp VPP", description: "Yêu cầu cấp phát văn phòng phẩm",
    category: "TIỆN ÍCH", icon: "📎", url: "#", links: "[]",
    access_role: "all", status: "active", order: 2,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "23", name: "Sổ tay Nhân viên", description: "Cẩm nang quy định, chính sách công ty",
    category: "TIỆN ÍCH", icon: "📖", url: "#", links: "[]",
    access_role: "all", status: "active", order: 3,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "24", name: "Helpdesk (Hỗ trợ IT)", description: "Gửi yêu cầu sửa lỗi máy tính và thiết bị",
    category: "TIỆN ÍCH", icon: "🔧", url: "#", links: "[]",
    access_role: "all", status: "active", order: 4,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
  {
    id: "25", name: "Bảng tin Nội bộ", description: "Cập nhật thông báo mới nhất của công ty",
    category: "TIỆN ÍCH", icon: "📣", url: "#", links: "[]",
    access_role: "all", status: "active", order: 5,
    created_at: "2024-01-01", updated_at: "2024-01-01", version: 1, deleted: false
  },
];

const MOCK_USERS = [
  { id: "u1", name: "Admin", email: "admin@company.vn", role: "admin", department: "IT", avatar: "", active: true, version: 1, deleted: false, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

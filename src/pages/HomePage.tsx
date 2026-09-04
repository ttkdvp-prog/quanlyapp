import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ExternalLink, ChevronRight, AlertCircle, Loader2, Link2, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { api, parseApp } from "../lib/apiClient";
import { useSheetStream } from "../lib/useSheetStream";
import type { App, ParsedApp } from "../types";
import AppFormModal from "../components/AppFormModal";
import CategoryOrderModal from "../components/CategoryOrderModal";
import { toast } from "sonner";

// Category order and colors
const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  "TIỆN ÍCH": {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  "Googsheet": {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  "ứng dụng": {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  "công việc": {
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
};

const DEFAULT_CATEGORY_ORDER = ["TIỆN ÍCH", "Googsheet", "ứng dụng", "công việc"];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  finance: "Kế toán",
  hr: "Nhân sự",
  marketing: "Marketing",
  all: "",
};

function getRoleBadge(role: string) {
  if (!role || role === "all") return null;
  return ROLE_LABELS[role] || role;
}

// App Card component
function AppCard({ app, onEdit, onDelete }: { app: ParsedApp; onEdit: (a: ParsedApp) => void; onDelete: (a: ParsedApp) => void }) {
  const isEmoji = app.icon && app.icon.length <= 4 && !/^https?:\/\//.test(app.icon);
  const roleBadge = getRoleBadge(app.access_role);

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking edit/delete buttons
    if ((e.target as HTMLElement).closest(".card-action-btn")) return;
    if (app.url && app.url !== "#") {
      window.open(app.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="app-card bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer select-none group relative overflow-hidden"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label={`Mở ${app.name}`}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
    >
      {/* Hover shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/3 group-hover:to-indigo-500/3 transition-all duration-300 rounded-2xl pointer-events-none" />

      {/* Edit / Delete action buttons — appear on hover */}
      <div className="card-action-btn absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(app); }}
          title="Chỉnh sửa"
          className="card-action-btn w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 shadow-sm transition-all"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(app); }}
          title="Xóa"
          className="card-action-btn w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 shadow-sm transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-200 shadow-sm">
          {isEmoji ? (
            <span>{app.icon}</span>
          ) : app.icon ? (
            <img src={app.icon} alt={app.name} className="w-7 h-7 object-contain" />
          ) : (
            <Link2 size={22} className="text-slate-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors flex-1">
              {app.name}
            </h3>
            {roleBadge && (
              <span className="shrink-0 badge bg-red-50 text-red-600 border border-red-100 text-[10px] mt-0.5">
                🔒
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {app.description}
          </p>

          {/* Secondary links */}
          {app.links && app.links.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {app.links.slice(0, 2).map((link, i) => (
                <button
                  key={i}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(link.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink size={10} />
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom arrow indicator */}
      {app.url && app.url !== "#" && (
        <ChevronRight
          size={14}
          className="absolute bottom-3 right-3 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200"
        />
      )}
    </div>
  );
}

// Category Section component
function CategorySection({ category, apps, onEdit, onDelete }: { category: string; apps: ParsedApp[]; onEdit: (a: ParsedApp) => void; onDelete: (a: ParsedApp) => void }) {
  const cfg = CATEGORY_CONFIG[category] || {
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-500",
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 category-label">
        <div className={`w-1 h-6 rounded-full ${cfg.dot}`} />
        <h2 className={`text-base font-bold tracking-wide ${cfg.color}`}>
          {category}
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {apps.length} ứng dụng
        </span>
      </div>
      <div className="grid grid-cols-2 @md:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4 gap-3">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// Add App Modal
// (see AppFormModal component)

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState<ParsedApp | null>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch apps from Google Sheets
  const {
    data: rawApps,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const env = await api.list<App>("apps");
      return (env.data || []).map(parseApp);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Saved category display order (shared across everyone via the sheet)
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.getSettings()).data,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const savedCategoryOrder = Array.isArray(settings?.categoryOrder)
    ? (settings!.categoryOrder as string[])
    : null;

  const baseApps = useMemo(() => rawApps ?? [], [rawApps]);

  // Live streaming updates
  const { rows: liveApps } = useSheetStream("apps", baseApps, { intervalMs: 30_000 });

  const handleDelete = async (app: ParsedApp) => {
    toast(`Xóa "${app.name}"?`, {
      action: {
        label: "Xóa",
        onClick: async () => {
          try {
            await api.delete("apps", app.id);
            toast.success(`Đã xóa "${app.name}"`);
            queryClient.invalidateQueries({ queryKey: ["apps"] });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Xóa thất bại");
          }
        },
      },
      cancel: { label: "Hủy", onClick: () => {} },
      duration: 8000,
    });
  };

  // Filter & group
  const filteredApps = useMemo(() => {
    let apps = liveApps;
    const q = search.toLowerCase().trim();
    if (q) {
      apps = apps.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      apps = apps.filter((a) => a.category === selectedCategory);
    }
    return apps;
  }, [liveApps, search, selectedCategory]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, ParsedApp[]> = {};
    for (const app of filteredApps) {
      if (!map[app.category]) map[app.category] = [];
      map[app.category].push(app);
    }
    // Sort apps within each category
    for (const cat of Object.keys(map)) {
      map[cat].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return map;
  }, [filteredApps]);

  // Sort categories — saved order (if any) wins, falling back to the default
  const categoryOrder = savedCategoryOrder ?? DEFAULT_CATEGORY_ORDER;

  const sortedCategories = useMemo(() => {
    const cats = Object.keys(grouped);
    return cats.sort((a, b) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [grouped, categoryOrder]);

  const allCategories = useMemo(() => {
    const cats = new Set(liveApps.map((a) => a.category));
    return categoryOrder.filter((c) => cats.has(c)).concat(
      [...cats].filter((c) => !categoryOrder.includes(c))
    );
  }, [liveApps, categoryOrder]);

  const totalApps = filteredApps.length;

  return (
    <div className="min-h-full">
      {/* Search & action bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="app-search"
              type="text"
              placeholder="Tìm kiếm app..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200"
            />
          </div>

          {/* Category filter chips */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                !selectedCategory
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả
            </button>
            {allCategories.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    selectedCategory === cat
                      ? `${cfg?.bg || "bg-slate-50"} ${cfg?.color || "text-slate-700"} border ${cfg?.border || "border-slate-200"}`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sort categories button */}
          {allCategories.length > 1 && (
            <button
              type="button"
              title="Sắp xếp nhóm danh mục"
              onClick={() => setShowSortModal(true)}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowUpDown size={16} />
            </button>
          )}

          {/* Add app button */}
          <button
            id="btn-add-app"
            onClick={() => setShowAddModal(true)}
            className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">+ Thêm App</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={40} className="spinner text-blue-500" />
            <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <p className="text-slate-700 font-medium">Không thể tải dữ liệu</p>
            <p className="text-slate-500 text-sm text-center max-w-sm">
              {error instanceof Error ? error.message : "Lỗi kết nối. Vui lòng kiểm tra cấu hình Apps Script."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : totalApps === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="text-5xl">🔍</div>
            <p className="text-slate-700 font-medium">Không tìm thấy kết quả</p>
            <p className="text-slate-500 text-sm">
              Thử tìm với từ khóa khác hoặc{" "}
              <button
                onClick={() => { setSearch(""); setSelectedCategory(null); }}
                className="text-blue-600 underline"
              >
                xóa bộ lọc
              </button>
            </p>
          </div>
        ) : (
          <>
            {search || selectedCategory ? (
              <div className="mb-4 text-sm text-slate-500">
                Tìm thấy <span className="font-semibold text-slate-700">{totalApps}</span> ứng dụng
                {search && <> cho "<span className="text-blue-600">{search}</span>"</>}
              </div>
            ) : null}

            {sortedCategories.map((cat) => (
              <CategorySection key={cat} category={cat} apps={grouped[cat]} onEdit={setEditingApp} onDelete={handleDelete} />
            ))}
          </>
        )}
      </div>

      {/* Add App Modal */}
      {showAddModal && (
        <AppFormModal
          existingCategories={allCategories}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ["apps"] });
          }}
        />
      )}

      {/* Edit App Modal */}
      {editingApp && (
        <AppFormModal
          existingCategories={allCategories}
          editApp={editingApp}
          onClose={() => setEditingApp(null)}
          onSaved={() => {
            setEditingApp(null);
            queryClient.invalidateQueries({ queryKey: ["apps"] });
          }}
        />
      )}

      {/* Sort Categories Modal */}
      {showSortModal && (
        <CategoryOrderModal
          categories={allCategories}
          onClose={() => setShowSortModal(false)}
          onSaved={(order) => {
            setShowSortModal(false);
            queryClient.setQueryData(["settings"], { ...(settings || {}), categoryOrder: order });
          }}
        />
      )}
    </div>
  );
}

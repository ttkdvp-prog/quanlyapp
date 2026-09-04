import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/apiClient";
import { toast } from "sonner";
import type { AppLink } from "../types";

const ROLES = [
  { value: "all", label: "Tất cả nhân viên" },
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Kế toán" },
  { value: "hr", label: "Nhân sự" },
  { value: "marketing", label: "Marketing" },
];

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editApp?: {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    url: string;
    links: AppLink[];
    access_role: string;
    status: string;
    order: number;
  };
}

export default function AppFormModal({ onClose, onSaved, editApp }: Props) {
  const isEdit = !!editApp;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: editApp?.name ?? "",
    description: editApp?.description ?? "",
    category: editApp?.category ?? "",
    icon: editApp?.icon ?? "",
    url: editApp?.url ?? "",
    access_role: editApp?.access_role ?? "all",
    status: editApp?.status ?? "active",
    order: editApp?.order ?? 99,
  });

  const [links, setLinks] = useState<AppLink[]>(editApp?.links ?? []);

  const setField = (key: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addLink = () => setLinks((l) => [...l, { label: "", url: "" }]);
  const removeLink = (i: number) => setLinks((l) => l.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: keyof AppLink, value: string) =>
    setLinks((l) => l.map((lnk, idx) => (idx === i ? { ...lnk, [field]: value } : lnk)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên ứng dụng");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        links: JSON.stringify(links.filter((l) => l.label && l.url)),
        order: Number(form.order),
      };

      if (isEdit && editApp) {
        await api.update("apps", editApp.id, data);
        toast.success("Đã cập nhật ứng dụng");
      } else {
        await api.create("apps", data);
        toast.success("Đã thêm ứng dụng mới");
      }

      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto bg-white sm:rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? "Chỉnh sửa ứng dụng" : "Thêm ứng dụng mới"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Icon & Name row */}
          <div className="flex gap-3">
            <div className="w-24">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Icon (emoji)
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setField("icon", e.target.value)}
                placeholder="📊"
                maxLength={4}
                className="w-full text-center text-2xl px-2 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Tên ứng dụng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ví dụ: Báo cáo Thu Chi"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Mô tả chức năng của ứng dụng..."
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Category & Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Nhóm danh mục
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="Ví dụ: NHÂN SỰ"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                required
              />
              <datalist id="category-suggestions">
                <option value="NHÂN SỰ" />
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Phân quyền
              </label>
              <select
                value={form.access_role}
                onChange={(e) => setField("access_role", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary URL */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Đường link chính
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://docs.google.com/..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Additional links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">
                Link phụ (tùy chọn)
              </label>
              <button
                type="button"
                onClick={addLink}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Plus size={13} />
                Thêm link
              </button>
            </div>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                    placeholder="Nhãn (vd: Báo cáo Q1)"
                    className="w-32 px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 transition"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setField("order", e.target.value)}
                min={1}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ẩn</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="app-form"
            disabled={saving}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-60 active:scale-95"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                Đang lưu...
              </>
            ) : (
              isEdit ? "Cập nhật" : "Thêm mới"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { X, GripVertical } from "lucide-react";
import { api } from "../lib/apiClient";
import { toast } from "sonner";

interface Props {
  categories: string[];
  onClose: () => void;
  onSaved: (order: string[]) => void;
}

export default function CategoryOrderModal({ categories, onClose, onSaved }: Props) {
  const [order, setOrder] = useState<string[]>(categories);
  const [saving, setSaving] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragIndex.current = index;
    setDraggingIdx(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragIndex.current === null) return;
    const y = e.clientY;
    let targetIndex = order.length - 1;
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y < rect.top + rect.height / 2) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex !== dragIndex.current) {
      setOrder((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex.current!, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
      dragIndex.current = targetIndex;
      setDraggingIdx(targetIndex);
    }
  };

  const handlePointerUp = () => {
    dragIndex.current = null;
    setDraggingIdx(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.setSettings({ categoryOrder: order });
      toast.success("Đã lưu thứ tự nhóm");
      onSaved(order);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm max-h-[85dvh] overflow-hidden bg-white sm:rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Sắp xếp nhóm danh mục</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="px-6 pt-3 text-xs text-slate-500">
          Kéo biểu tượng ☰ để đổi vị trí, hoặc dùng nút mũi tên.
        </p>

        <div className="flex-1 overflow-y-auto p-6 space-y-2" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          {order.map((cat, i) => (
            <div
              key={cat}
              ref={(el) => { itemRefs.current[i] = el; }}
              className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2.5 select-none transition-colors ${
                draggingIdx === i ? "border-blue-400 bg-blue-50 shadow-sm" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onPointerDown={handlePointerDown(i)}
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 touch-none"
                aria-label="Kéo để sắp xếp"
              >
                <GripVertical size={16} />
              </button>
              <span className="flex-1 text-sm font-medium text-slate-800">{cat}</span>
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 leading-none px-1"
                  aria-label="Lên"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 leading-none px-1"
                  aria-label="Xuống"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-60 active:scale-95"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                Đang lưu...
              </>
            ) : (
              "Lưu thứ tự"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

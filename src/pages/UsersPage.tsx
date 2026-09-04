import { Users, Mail, Building2, Shield, Search, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import type { User } from "../types";

const DEPARTMENTS = ["Tất cả", "Ban giám đốc"];

function UserCard({ user }: { user: User }) {
  const isActive = user.active === true || String(user.active).toUpperCase() === "TRUE";
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 text-sm truncate">{user.name}</span>
            <span
              className={`badge text-xs ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              {isActive ? "Hoạt động" : "Ngừng"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <Mail size={11} />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Building2 size={12} />
          {user.department || "—"}
        </div>
        <span
          className={`badge text-xs ${
            user.role === "admin"
              ? "bg-blue-50 text-blue-700 border border-blue-100"
              : "bg-slate-50 text-slate-600 border border-slate-200"
          }`}
        >
          <Shield size={10} />
          {user.role === "admin" ? "Admin" : "User"}
        </span>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("Tất cả");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const env = await api.list<User>("users");
      return env.data || [];
    },
    staleTime: 60_000,
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department || "").toLowerCase().includes(q);
    const matchDept = dept === "Tất cả" || u.department === dept;
    return matchSearch && matchDept && !(u.deleted === true || String(u.deleted).toUpperCase() === "TRUE");
  });

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-blue-600" />
            Người dùng
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} / {users.length} người dùng
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
          <Plus size={16} />
          <span className="hidden sm:inline">Thêm người dùng</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                dept === d
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Users size={40} />
          <p className="text-sm">Không có người dùng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}

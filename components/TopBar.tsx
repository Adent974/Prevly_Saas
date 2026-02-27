"use client";
import { Bell } from "lucide-react";

interface TopBarProps {
  user: {
    name: string;
    email: string;
    specialty?: string;
    organizationName?: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">
          {user.specialty ?? "Professionnel de santé"}{" "}
          {user.organizationName && `· ${user.organizationName}`}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
          <Bell size={18} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
            <span className="text-rose-600 font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

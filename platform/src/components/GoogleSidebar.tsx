'use client';

import React from 'react';
import { Tenant, AuthUser } from '../types/platform';
import { ValentinaLogo } from './ValentinaLogo';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Cpu,
  BookOpen,
  ShieldCheck,
  Building2,
  LogOut,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  FileText,
  Smartphone,
  Activity,
} from 'lucide-react';

interface GoogleSidebarProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  activeView: 'client' | 'admin';
  onChangeView: (view: 'client' | 'admin') => void;
  clientTab: 'inbox' | 'analytics' | 'channels' | 'knowledge';
  onChangeClientTab: (tab: 'inbox' | 'analytics' | 'channels' | 'knowledge') => void;
  currentUser: AuthUser;
  onLogout: () => void;
  unreadCount?: number;
}

export const GoogleSidebar: React.FC<GoogleSidebarProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  activeView,
  onChangeView,
  clientTab,
  onChangeClientTab,
  currentUser,
  onLogout,
  unreadCount = 0,
}) => {
  const isSuperAdmin = currentUser.role === 'superadmin';

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col justify-between bg-white border-r border-[#dadce0] select-none shrink-0 z-30">
      {/* Top: Brand Header */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center border-b border-[#dadce0]">
          <ValentinaLogo size="md" withText theme="light" />
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {/* Main Sections */}
          <div className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3 py-1.5">
            Menú Principal
          </div>

          <button
            onClick={() => {
              onChangeView('client');
              onChangeClientTab('inbox');
            }}
            className={`w-full google-nav-item cursor-pointer ${
              activeView === 'client' && clientTab === 'inbox' ? 'active' : ''
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="flex-1 text-left">Bandeja en vivo</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#0b57d0] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onChangeView('client');
              onChangeClientTab('channels');
            }}
            className={`w-full google-nav-item cursor-pointer ${
              activeView === 'client' && clientTab === 'channels' ? 'active' : ''
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="flex-1 text-left">Canales & Hardware</span>
            <span className="text-[11px] text-[#5f6368] font-mono">
              {currentTenant.channels.length}
            </span>
          </button>

          <button
            onClick={() => {
              onChangeView('client');
              onChangeClientTab('knowledge');
            }}
            className={`w-full google-nav-item cursor-pointer ${
              activeView === 'client' && clientTab === 'knowledge' ? 'active' : ''
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="flex-1 text-left">Base de Conocimiento</span>
          </button>

          <button
            onClick={() => {
              onChangeView('client');
              onChangeClientTab('analytics');
            }}
            className={`w-full google-nav-item cursor-pointer ${
              activeView === 'client' && clientTab === 'analytics' ? 'active' : ''
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="flex-1 text-left">Métricas & Costos</span>
          </button>

          {/* SuperAdmin HQ Section (Only if SuperAdmin) */}
          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-1 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3">
                Administración Global
              </div>

              <button
                onClick={() => onChangeView('admin')}
                className={`w-full google-nav-item cursor-pointer ${
                  activeView === 'admin' ? 'active' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#0b57d0]" />
                <span className="flex-1 text-left font-semibold">SuperAdmin HQ</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#fce8e6] text-[#c5221f]">
                  ADMIN
                </span>
              </button>
            </>
          )}

          {/* External Links */}
          <div className="pt-4 pb-1 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3">
            Recursos
          </div>

          <a
            href="https://valentina-ai.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full google-nav-item"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="flex-1 text-left">Sitio Web Comercial</span>
          </a>
        </nav>
      </div>

      {/* Bottom: System Status & User Profile */}
      <div className="p-3 border-t border-[#dadce0] bg-[#f8f9fa] space-y-2">
        {/* System Health Status */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-[#dadce0] text-xs">
          <div className="flex items-center gap-2 text-[#137333] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse"></span>
            <span>Meta API: En línea</span>
          </div>
          <span className="text-[10px] font-mono text-[#5f6368]">118ms</span>
        </div>

        {/* User Card & Clear Logout Button */}
        <div className="p-2.5 rounded-xl bg-white border border-[#dadce0] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#0b57d0] font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#1f1f1f] truncate leading-tight">
                {currentUser.fullName}
              </p>
              <p className="text-[10px] text-[#5f6368] truncate font-mono">
                {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            className="flex items-center gap-1 px-2 py-1 text-[#5f6368] hover:text-[#c5221f] hover:bg-[#fce8e6] rounded-lg transition shrink-0 cursor-pointer text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px]">Salir</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

'use client';

import React from 'react';
import { Tenant, AuthUser } from '../types/platform';
import { ValentinaLogo } from './ValentinaLogo';
import { getAllowedTabsForUser, getUserLevelConfig, ClientTab } from '../lib/permissions';
import {
  MessageSquare,
  BarChart3,
  BookOpen,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Smartphone,
  X,
} from 'lucide-react';

interface GoogleSidebarProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  activeView: 'client' | 'admin';
  onChangeView: (view: 'client' | 'admin') => void;
  clientTab: ClientTab;
  onChangeClientTab: (tab: ClientTab) => void;
  currentUser: AuthUser;
  onLogout: () => void;
  unreadCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  mobileOpen = false,
  onCloseMobile,
}) => {
  const isSuperAdmin = currentUser.role === 'superadmin';
  const allowedTabs = getAllowedTabsForUser(currentUser);
  const levelConfig = getUserLevelConfig(currentUser);

  const handleNavClick = (view: 'client' | 'admin', tab?: ClientTab) => {
    onChangeView(view);
    if (tab) onChangeClientTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const renderSidebarBody = (isDrawer = false) => (
    <div className="flex flex-col justify-between h-full bg-white select-none">
      {/* Top: Brand Header & Nav Links */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#dadce0]">
          <ValentinaLogo size="md" withText theme="light" />
          {isDrawer && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {/* Main Sections */}
          <div className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
            <span>Menú Principal</span>
            <span className="text-[10px] text-[#747775] font-normal">
              {allowedTabs.length === 1 ? 'Vista Única' : `${allowedTabs.length} módulos`}
            </span>
          </div>

          {/* Bandeja en vivo: solo si está autorizada */}
          {allowedTabs.includes('inbox') && (
            <button
              onClick={() => handleNavClick('client', 'inbox')}
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
          )}

          {/* Canales & Hardware: solo si está autorizada */}
          {allowedTabs.includes('channels') && (
            <button
              onClick={() => handleNavClick('client', 'channels')}
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
          )}

          {/* Base de Conocimiento: solo si está autorizada */}
          {allowedTabs.includes('knowledge') && (
            <button
              onClick={() => handleNavClick('client', 'knowledge')}
              className={`w-full google-nav-item cursor-pointer ${
                activeView === 'client' && clientTab === 'knowledge' ? 'active' : ''
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="flex-1 text-left">Base de Conocimiento</span>
            </button>
          )}

          {/* Métricas & Costos: solo si está autorizada */}
          {allowedTabs.includes('analytics') && (
            <button
              onClick={() => handleNavClick('client', 'analytics')}
              className={`w-full google-nav-item cursor-pointer ${
                activeView === 'client' && clientTab === 'analytics' ? 'active' : ''
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="flex-1 text-left">Métricas & Costos</span>
            </button>
          )}

          {/* SuperAdmin HQ Section (Only if SuperAdmin) */}
          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-1 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3">
                Administración Global
              </div>

              <button
                onClick={() => handleNavClick('admin')}
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
        <div className="p-2.5 rounded-xl bg-white border border-[#dadce0] space-y-2">
          <div className="flex items-center justify-between gap-2">
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

          <div className="pt-1.5 border-t border-[#f1f3f4] flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${levelConfig.badgeStyle}`}
            >
              {levelConfig.badgeLabel}
            </span>
            {currentUser.jobTitle && (
              <span className="text-[10px] text-[#747775] truncate max-w-[120px]" title={currentUser.jobTitle}>
                {currentUser.jobTitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (Visible en pantallas grandes lg+) */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col justify-between border-r border-[#dadce0] shrink-0 z-30">
        {renderSidebarBody(false)}
      </aside>

      {/* 2. Mobile Drawer Slide-over (Visible solo en mobile/tablet al abrir) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop con desenfoque suave */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer contenedor deslizable */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarBody(true)}
          </div>
        </div>
      )}
    </>
  );
};

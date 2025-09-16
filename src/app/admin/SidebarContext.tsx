"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isExpanded: boolean;
  isMobile: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // 在移动端，默认关闭侧边栏
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 从localStorage恢复桌面端侧边栏状态
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem("sidebar-expanded");
      if (saved !== null) {
        setIsExpanded(JSON.parse(saved));
      }
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      localStorage.setItem("sidebar-expanded", JSON.stringify(newExpanded));
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsExpanded(false);
      localStorage.setItem("sidebar-expanded", JSON.stringify(false));
    }
  };

  const openSidebar = () => {
    if (isMobile) {
      setIsOpen(true);
    } else {
      setIsExpanded(true);
      localStorage.setItem("sidebar-expanded", JSON.stringify(true));
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobile,
        isOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

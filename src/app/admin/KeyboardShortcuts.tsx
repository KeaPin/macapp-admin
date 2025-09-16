"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";

export default function KeyboardShortcuts() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // 检查是否在输入框中
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === "INPUT" || 
                       target.tagName === "TEXTAREA" || 
                       target.contentEditable === "true";

      // Cmd/Ctrl + K - 全局搜索 (这里只显示提示，实际功能可以后续添加)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        // 这里可以实现全局搜索功能
        console.log("Global search triggered");
        return;
      }

      // 如果在输入框中，不处理其他快捷键
      if (isInInput) return;

      // Cmd/Ctrl + B - 切换侧边栏
      if ((event.metaKey || event.ctrlKey) && event.key === "b") {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // 数字键快速导航
      if (event.key >= "1" && event.key <= "3") {
        event.preventDefault();
        const routes = ["/admin", "/admin/categories", "/admin/resources"];
        const index = parseInt(event.key) - 1;
        if (routes[index]) {
          router.push(routes[index]);
        }
        return;
      }

      // G 然后 H - Go Home (概览)
      if (event.key === "g") {
        const handleSecondKey = (secondEvent: KeyboardEvent) => {
          if (secondEvent.key === "h") {
            secondEvent.preventDefault();
            router.push("/admin");
          }
          document.removeEventListener("keydown", handleSecondKey);
        };
        
        document.addEventListener("keydown", handleSecondKey);
        setTimeout(() => {
          document.removeEventListener("keydown", handleSecondKey);
        }, 1000);
        return;
      }

      // ESC - 关闭模态框/清除焦点
      if (event.key === "Escape") {
        // 移除所有元素的焦点
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      // ? - 显示快捷键帮助
      if (event.key === "?" && !event.shiftKey) {
        event.preventDefault();
        showKeyboardHelp();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleSidebar]);

  function showKeyboardHelp() {
    // 创建快捷键帮助模态框
    const helpText = `
键盘快捷键:

导航:
• 1 - 概览页面
• 2 - 分类管理
• 3 - 资源管理
• G + H - 快速回到首页

操作:
• Cmd/Ctrl + B - 切换侧边栏
• Cmd/Ctrl + K - 全局搜索
• ESC - 取消当前操作
• ? - 显示此帮助

提示: 在输入框中时快捷键会被禁用
    `.trim();

    alert(helpText);
  }

  // 添加快捷键指示器到右下角
  return (
    <div className="fixed bottom-4 right-4 z-40 hidden lg:block">
      <button
        onClick={showKeyboardHelp}
        className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors shadow-lg"
        title="键盘快捷键帮助 (?)"
        aria-label="显示键盘快捷键帮助"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
}

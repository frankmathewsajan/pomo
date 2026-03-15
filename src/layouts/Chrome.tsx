import { useEffect, useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { useApp } from "../context/AppContext";
import Timer from "../components/Timer.tsx";
import { T } from "../utils/themes";
import ActivitySidebar from "../components/ActivitySidebar";
import QueueSidebar from "../components/QueueSidebar";
import SyncMenu from "../components/SyncMenu";

export default function Chrome() {
  const { theme, next, toggle } = useApp();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const globalShortcut = "CommandOrControl+Alt+Shift+P";
  const hasTauriInvoke = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__?.invoke;

  const toggleLeft = () => {
    if (!leftOpen && rightOpen && window.innerWidth < 1100) {
      setRightOpen(false);
    }
    setLeftOpen(!leftOpen);
  };

  const toggleRight = () => {
    if (!rightOpen && leftOpen && window.innerWidth < 1100) {
      setLeftOpen(false);
    }
    setRightOpen(!rightOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 950 && leftOpen && rightOpen) {
        setRightOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [leftOpen, rightOpen]);

  useEffect(() => {
    const calculateAndSetWidth = async () => {
      try {
        const appWindow = getCurrentWindow();
        const factor = await appWindow.scaleFactor();
        const currentPhysical = await appWindow.innerSize();
        const currentLogical = currentPhysical.toLogical(factor);

        const leftWidth = leftOpen ? 360 : 56;
        const rightWidth = rightOpen ? 360 : 56;
        const targetWidth = 720 + leftWidth + rightWidth;

        await appWindow.setSize(new LogicalSize(targetWidth, currentLogical.height));
      } catch (err) {
        console.error("Failed to resize window:", err);
      }
    };

    if (hasTauriInvoke) {
      calculateAndSetWidth();
    }
  }, [leftOpen, rightOpen, hasTauriInvoke]);

  useEffect(() => {
    let active = true;

    const setupShortcut = async () => {
      try {
        const alreadyRegistered = await isRegistered(globalShortcut);
        if (!alreadyRegistered) {
          await register(globalShortcut, () => {
            if (active) toggle();
          });
        }
      } catch (error) {
        console.error("Failed to register global shortcut:", error);
      }
    };

    if (hasTauriInvoke) {
      setupShortcut();
    }

    return () => {
      active = false;
      if (!hasTauriInvoke) return;
      void unregister(globalShortcut).catch((error) => {
        console.error("Failed to unregister global shortcut:", error);
      });
    };
  }, [toggle, hasTauriInvoke]);

  const nextThemeIndex = (theme + 1) % T.length;
  const nextThemeAccent = T[nextThemeIndex].v["--accent"];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
      <div data-tauri-drag-region className="titlebar flex items-center justify-between px-8 py-5 select-none border-b transition-colors" style={{ borderColor: "var(--border-ring)" }}>
        <div className="flex items-center gap-6">
          <span className="text-sm font-black opacity-40 hover:opacity-100 transition-opacity tracking-widest pl-2">&nbsp;&nbsp;&nbsp;POMO</span>
        </div>

        <div className="flex gap-2 z-50">
          <button className="wb size-7 flex items-center justify-center hover:bg-black/10 transition-colors rounded" onClick={() => getCurrentWindow().minimize()}>─</button>
          <button className="wb size-7 flex items-center justify-center hover:bg-black/10 transition-colors rounded" onClick={() => getCurrentWindow().toggleMaximize()}>□</button>
          <button className="wb close size-7 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded" onClick={() => getCurrentWindow().close()}>✕</button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden backdrop-blur-3xl" style={{ backdropFilter: "var(--backdrop)", WebkitBackdropFilter: "var(--backdrop)" }}>
        <ActivitySidebar isOpen={leftOpen} onToggle={toggleLeft} />
        <main className="flex-1 min-w-125 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto relative">
          <Timer />

          <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-50 flex flex-col items-center gap-4">
            <button className="size-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all shadow-sm cursor-pointer hover:scale-105" onClick={next} title={`Next Theme: ${T[nextThemeIndex].name}`}>
              <svg className="size-5 transition-colors" style={{ color: nextThemeAccent, opacity: 0.85 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>

            <SyncMenu />
          </div>
        </main>
        <QueueSidebar isOpen={rightOpen} onToggle={toggleRight} />
      </div>
    </div>
  );
}

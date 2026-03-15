import { useEffect, useRef } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { play90Sound, play100Sound } from "../utils/sounds";
import type { Block } from "../types";

async function notify(title: string, body: string) {
  if (typeof window === "undefined" || !(window as any).__TAURI__) return;

  try {
    let ok = await isPermissionGranted();
    if (!ok) ok = (await requestPermission()) === "granted";
    if (ok) sendNotification({ title, body });
  } catch (error) {
    console.error("Notification error:", error);
  }
}

export function useTimerNotifications(progress: number, running: boolean, mode: "w" | "b" | "idle" | "wait", block: Block | "idle") {
  const notified90 = useRef(false);
  const notified100 = useRef(false);

  useEffect(() => {
    if (progress < 0.9) {
      notified90.current = false;
      notified100.current = false;
    }

    if (running && mode === "w") {
      if (progress >= 0.9 && !notified90.current && progress < 1) {
        notified90.current = true;
        play90Sound();
        notify("Almost done!", `Your ${block} block is 90% complete.`);
      }

      if (progress >= 1 && !notified100.current) {
        notified100.current = true;
        play100Sound();
        notify("Block complete!", `Your ${block} block has finished.`);
      }
    }
  }, [block, mode, progress, running]);
}
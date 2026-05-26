import { useEffect } from "react";

export function useNotifications() {
  useEffect(() => {
    registerSW();
    scheduleDailyCheck();
  }, []);
}

async function registerSW() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (_) {}
  }
}

function getTodayKey() {
  return new Date().toDateString();
}

function hasTodayEntry(): boolean {
  const noExpenseDays: string[] = JSON.parse(localStorage.getItem("noExpenseDays") || "[]");
  if (noExpenseDays.includes(getTodayKey())) return true;
  const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
  return expenses.some((e: { date: string }) => new Date(e.date).toDateString() === getTodayKey());
}

async function sendNotification(title: string, body: string) {
  if (Notification.permission !== "granted") return;
  // Use service worker notification if available (works on mobile)
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      reg.showNotification(title, { body, icon: "/favicon.ico", tag: "expense-reminder", renotify: true });
      return;
    }
  }
  new Notification(title, { body, icon: "/favicon.ico" });
}

function msUntil(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function scheduleDailyCheck() {
  const settings = JSON.parse(localStorage.getItem("notificationSettings") || "null");
  if (!settings?.enabled) return;

  const [hour, minute] = (settings.time as string).split(":").map(Number);

  setTimeout(async () => {
    if (!hasTodayEntry()) {
      await sendNotification("💰 Log your expenses!", "Don't forget to record today's spending.");
    }
    scheduleDailyCheck();
  }, msUntil(hour, minute));

  const followUpHour = (hour + 2) % 24;
  setTimeout(async () => {
    if (!hasTodayEntry()) {
      await sendNotification("⚠️ Still no expenses logged!", "Tap to add expenses or mark as a No Expense Day.");
    }
  }, msUntil(followUpHour, minute));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  // Must be called directly from user gesture — no await wrapping
  const result = await Notification.requestPermission();
  return result === "granted";
}

import { User, Task, AppSettings, DashboardStats, TaskSubmission, Withdrawal, Transaction } from "../types";

export async function syncUserAPI(userData: {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  referralCodeInput?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return await res.json();
  } catch (err) {
    console.error("syncUserAPI error:", err);
    return { success: false, error: "সার্ভারে সংযোগ করা সম্ভব হয়নি" };
  }
}

export async function getUserProfileAPI(telegramId: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(`/api/user/profile/${telegramId}`);
    return await res.json();
  } catch (err) {
    console.error("getUserProfileAPI error:", err);
    return { success: false, error: "ইউজার প্রফাইল লোড করতে সমস্যা হয়েছে" };
  }
}

export async function getTasksAPI(telegramId?: string): Promise<{ success: boolean; tasks?: (Task & { userStatus?: string; submission?: any })[]; error?: string }> {
  try {
    const url = telegramId ? `/api/tasks?telegramId=${telegramId}` : "/api/tasks";
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("getTasksAPI error:", err);
    return { success: false, error: "টাস্ক তালিকা লোড করা যায়নি" };
  }
}

export async function submitTaskProofAPI(payload: {
  taskId: string;
  telegramId: string;
  proofText: string;
  proofImage?: string;
}): Promise<{ success: boolean; message?: string; submission?: any; error?: string }> {
  try {
    const res = await fetch("/api/tasks/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error("submitTaskProofAPI error:", err);
    return { success: false, error: "প্রুফ জমা দিতে সমস্যা হয়েছে" };
  }
}

export async function submitWithdrawalAPI(payload: {
  telegramId: string;
  amount: number;
  paymentMethod: "bkash" | "nagad";
  accountNumber: string;
}): Promise<{ success: boolean; message?: string; newBalance?: number; error?: string }> {
  try {
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error("submitWithdrawalAPI error:", err);
    return { success: false, error: "উত্তোলন অনুরোধ করতে সমস্যা হয়েছে" };
  }
}

export async function getUserHistoryAPI(telegramId: string): Promise<{
  success: boolean;
  transactions?: Transaction[];
  submissions?: TaskSubmission[];
  withdrawals?: Withdrawal[];
  referrals?: any[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/user/history/${telegramId}`);
    return await res.json();
  } catch (err) {
    console.error("getUserHistoryAPI error:", err);
    return { success: false, error: "ইতিহাস লোড করা যায়নি" };
  }
}

export async function getAppSettingsAPI(): Promise<{ success: boolean; settings?: AppSettings; error?: string }> {
  try {
    const res = await fetch("/api/settings");
    return await res.json();
  } catch (err) {
    console.error("getAppSettingsAPI error:", err);
    return { success: false, error: "অ্যাপ সেটিংস লোড করা যায়নি" };
  }
}

// Admin API calls
export async function adminLoginAPI(payload: { email?: string; password?: string; idToken?: string } | string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const body = typeof payload === "string" ? { password: payload } : payload;
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error("adminLoginAPI error:", err);
    return { success: false, error: "অ্যাডমিন লগইন করতে সমস্যা হয়েছে" };
  }
}

export async function getAdminStatsAPI(adminPassword: string): Promise<{ success: boolean; stats?: DashboardStats; error?: string }> {
  try {
    const res = await fetch("/api/admin/stats", {
      headers: { "X-Admin-Password": adminPassword },
    });
    return await res.json();
  } catch (err) {
    console.error("getAdminStatsAPI error:", err);
    return { success: false, error: "পরিসংখ্যান লোড করা যায়নি" };
  }
}

export async function getAdminUsersAPI(adminPassword: string): Promise<{ success: boolean; users?: User[]; error?: string }> {
  try {
    const res = await fetch("/api/admin/users", {
      headers: { "X-Admin-Password": adminPassword },
    });
    return await res.json();
  } catch (err) {
    console.error("getAdminUsersAPI error:", err);
    return { success: false, error: "ইউজারদের তালিকা লোড করা যায়নি" };
  }
}

export async function updateAdminUserBalanceAPI(adminPassword: string, telegramId: string, newBalance: number, reason?: string) {
  try {
    const res = await fetch(`/api/admin/users/${telegramId}/balance`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify({ newBalance, reason }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "ব্যালেন্স আপডেট করতে ব্যর্থ" };
  }
}

export async function getAdminProofsAPI(adminPassword: string) {
  try {
    const res = await fetch("/api/admin/proofs", {
      headers: { "X-Admin-Password": adminPassword },
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "প্রুফ তালিকা লোড করা যায়নি" };
  }
}

export async function reviewProofAPI(adminPassword: string, id: string, status: "approved" | "rejected", rejectionReason?: string) {
  try {
    const res = await fetch(`/api/admin/proofs/${id}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify({ status, rejectionReason }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "রিভিউ সম্পন্ন করা যায়নি" };
  }
}

export async function getAdminWithdrawalsAPI(adminPassword: string) {
  try {
    const res = await fetch("/api/admin/withdrawals", {
      headers: { "X-Admin-Password": adminPassword },
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "উত্তোলন তালিকা লোড করা যায়নি" };
  }
}

export async function reviewWithdrawalAPI(adminPassword: string, id: string, status: "approved" | "rejected", rejectionReason?: string) {
  try {
    const res = await fetch(`/api/admin/withdrawals/${id}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify({ status, rejectionReason }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "উত্তোলন রিভিউ সম্পন্ন করা যায়নি" };
  }
}

export async function getAdminTasksAPI(adminPassword: string) {
  try {
    const res = await fetch("/api/admin/tasks", {
      headers: { "X-Admin-Password": adminPassword },
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "টাস্ক তালিকা লোড করা যায়নি" };
  }
}

export async function createAdminTaskAPI(adminPassword: string, taskData: Partial<Task>) {
  try {
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify(taskData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "টাস্ক তৈরি করা যায়নি" };
  }
}

export async function updateAdminTaskAPI(adminPassword: string, id: string, taskData: Partial<Task>) {
  try {
    const res = await fetch(`/api/admin/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify(taskData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "টাস্ক আপডেট করা যায়নি" };
  }
}

export async function deleteAdminTaskAPI(adminPassword: string, id: string) {
  try {
    const res = await fetch(`/api/admin/tasks/${id}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": adminPassword },
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "টাস্ক মোছা সম্ভব হয়নি" };
  }
}

export async function updateAdminSettingsAPI(adminPassword: string, settingsData: any) {
  try {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify(settingsData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "সেটিংস আপডেট ব্যর্থ হয়েছে" };
  }
}

export async function toggleAdminUserStatusAPI(adminPassword: string, telegramId: string, status: "active" | "banned") {
  try {
    const res = await fetch(`/api/admin/users/${telegramId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "

import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  Task, 
  TaskSubmission, 
  Transaction, 
  Withdrawal, 
  ReferralItem, 
  AppSettings, 
  Advertisement,
  Announcement,
  AdminLog
} from "./src/types.js";
import {
  saveUserToFirestore,
  saveTaskToFirestore,
  saveSubmissionToFirestore,
  saveWithdrawalToFirestore,
  saveReferralToFirestore,
  saveSettingsToFirestore,
  saveTransactionToFirestore,
  saveAdminLogToFirestore,
  loadInitialDataFromFirestore,
  ensureServerAdminAuth
} from "./src/lib/firestoreServer";

const app = express();
const PORT = 3000;

// Enable JSON parser with high limit for image proof uploads
app.use(express.json({ limit: "15mb" }));

// File persistence setup
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface Database {
  users: Record<string, User>;
  tasks: Task[];
  submissions: TaskSubmission[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  referrals: ReferralItem[];
  announcements: Announcement[];
  adminLogs: AdminLog[];
  settings: AppSettings;
  adminPassword: string;
}

// Initial default seed database
const defaultDb: Database = {
  users: {},
  tasks: [
    {
      id: "task-1",
      title: "Nexora Official Telegram চ্যানেলে জয়েন করুন",
      description: "আমাদের অফিশিয়াল চ্যানেলে যুক্ত হয়ে নিয়মিত আপডেট এবং স্পেশাল বোনাস পান।",
      instructions: "১. 'কাজ করুন' বাটনে ক্লিক করে অফিশিয়াল চ্যানেলে জয়েন করুন।\n২. জয়েন করার পর আপনার টেলিগ্রাম ইউজারনেম এবং একটি স্ক্রিনশট প্রুফ জমা দিন।",
      link: "https://t.me/NexoraEarn",
      reward: 15.00,
      proofRequired: true,
      active: true,
      category: "Telegram",
      createdAt: new Date().toISOString()
    },
    {
      id: "task-2",
      title: "Nexora Tech YouTube চ্যানেল সাবস্ক্রাইব করুন",
      description: "আমাদের অফিশিয়াল ইউটিউব চ্যানেল সাবস্ক্রাইব করুন এবং লেটেস্ট টিউটোরিয়াল দেখুন।",
      instructions: "১. লিংকে গিয়ে চ্যানেল সাবস্ক্রাইব করুন ও বেল আইকন অন করুন।\n২. আপনার ইউটিউব ইউজারনেম বা ইমেইল প্রুফ বক্সে লিখুন এবং স্ক্রিনশট জমা দিন।",
      link: "https://youtube.com/@NexoraTech",
      reward: 20.00,
      proofRequired: true,
      active: true,
      category: "YouTube",
      createdAt: new Date().toISOString()
    },
    {
      id: "task-3",
      title: "Nexora Facebook পেজে লাইক ও শেয়ার করুন",
      description: "ফেসবুক পেজে লাইক দিন এবং প্রথম পোস্টটি আপনার ওয়ালে শেয়ার করুন।",
      instructions: "১. পেজে গিয়ে লাইক ও শেয়ার দিন।\n২. প্রুফ হিসেবে আপনার ফেসবুক প্রোফাইল নাম ও লিঙ্ক জমা দিন।",
      link: "https://facebook.com/NexoraOfficial",
      reward: 10.00,
      proofRequired: true,
      active: true,
      category: "Facebook",
      createdAt: new Date().toISOString()
    },
    {
      id: "task-4",
      title: "Nexora Discussion গ্রুপের সদস্য হন",
      description: "আমাদের আড্ডার গ্রুপে যুক্ত হয়ে অন্যান্য ইউজারদের সাথে আলোচনা করুন।",
      instructions: "১. হেল্পলাইন ও ডিসকাশন গ্রুপে যুক্ত হন।\n২. আপনার টেলিগ্রাম ইউজারনেম জমা দিন।",
      link: "https://t.me/NexoraEarn",
      reward: 12.00,
      proofRequired: true,
      active: true,
      category: "Telegram",
      createdAt: new Date().toISOString()
    },
    {
      id: "task-5",
      title: "Nexora Partner App ফ্রি রেজিস্টার করুন",
      description: "পার্টনার অ্যাপে অ্যাকাউন্ট খুলে বোনাস রিওয়ার্ড জিতে নিন।",
      instructions: "১. ওয়েবসাইটে গিয়ে আপনার মোবাইল নম্বর দিয়ে অ্যাকাউন্ট তৈরি করুন।\n২. রেজিস্টার্ড ফোন নম্বর প্রুফ হিসেবে জমা দিন।",
      link: "https://t.me/NexoraTask2026Bot",
      reward: 25.00,
      proofRequired: true,
      active: true,
      category: "App",
      createdAt: new Date().toISOString()
    }
  ],
  submissions: [],
  transactions: [],
  withdrawals: [],  db.submissions.push(newSubmission);
  saveDatabase(db);

  return res.json({
    success: true,
    message: "আপনার প্রুফ সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করার পর রিওয়ার্ড যোগ হবে।",
    submission: newSubmission
  });
});

// Get user's task submission history
app.get("/api/user/submissions/:telegramId", (req, res) => {
  const tid = String(req.params.telegramId);

  const submissions = db.submissions
    .filter((s) => s.userTelegramId === tid)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return res.json({
    success: true,
    submissions
  });
});

// Get user transactions
app.get("/api/user/transactions/:telegramId", (req, res) => {
  const tid = String(req.params.telegramId);

  const transactions = db.transactions
    .filter((tx) => tx.userTelegramId === tid)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return res.json({
    success: true,
    transactions
  });
});

// Get user referrals
app.get("/api/user/referrals/:telegramId", (req, res) => {
  const tid = String(req.params.telegramId);

  const referrals = db.referrals
    .filter((r) => r.referrerTelegramId === tid)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return res.json({
    success: true,
    referrals
  });
});

// Get public app settings
app.get("/api/settings", (req, res) => {
  const publicSettings = {
    siteName: db.settings.siteName,
    siteLogo: db.settings.siteLogo,
    announcementNotice: db.settings.announcementNotice,
    minWithdrawal: db.settings.minWithdrawal,
    maxWithdrawal: db.settings.maxWithdrawal,
    referralReward: db.settings.referralReward,
    referralActive: db.settings.referralActive,
    whatsappSupport: db.settings.whatsappSupport,
    telegramSupport: db.settings.telegramSupport,
    maintenanceMode: db.settings.maintenanceMode,
    allowedGateways: db.settings.allowedGateways,
    adsEnabled: db.settings.adsEnabled,
    ads: db.settings.ads || []
  };

  return res.json({
    success: true,
    settings: publicSettings
  });
});

// Get active announcements
app.get("/api/announcements", (req, res) => {
  const announcements = db.announcements
    .filter((a) => a.active)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return res.json({
    success: true,
    announcements
  });
});

// Get active advertisements
app.get("/api/ads", (req, res) => {
  if (!db.settings.adsEnabled) {
    return res.json({
      success: true,
      ads: []
    });
  }

  const ads = (db.settings.ads || []).filter(
    (ad: Advertisement) => ad.active
  );

  return res.json({
    success: true,
    ads
  });
});

// Referral information for a user
app.get("/api/referral/:telegramId", (req, res) => {
  const tid = String(req.params.telegramId);
  const user = db.users[tid];

  if (!user) {
    return res.status(404).json({
      error: "ইউজার পাওয়া যায়নি"
    });
  }

  const referrals = db.referrals.filter(
    (r) => r.referrerTelegramId === tid
  );

  return res.json({
    success: true,
    referralCode: user.referralCode,
    referralsCount: user.referralsCount || 0,
    referralEarnings: user.referralEarnings || 0,
    referrals
  });
});

// Create withdrawal request
app.post("/api/withdraw", (req, res) => {
  if (db.settings.maintenanceMode) {
    return res.status(503).json({
      error:
        "সাইট বর্তমানে মেইনটেন্যান্স মোডে আছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।"
    });
  }

  const {
    telegramId,
    amount,
    gateway,
    accountNumber,
    accountName
  } = req.body;

  if (!telegramId || !amount || !gateway || !accountNumber) {
    return res.status(400).json({
      error: "সকল প্রয়োজনীয় তথ্য পূরণ করুন"
    });
  }

  const tid = String(telegramId);
  const user = db.users[tid];

  if (!user) {
    return res.status(404).json({
      error: "ইউজার পাওয়া যায়নি"
    });
  }

  if (user.status === "banned") {
    return res.status(403).json({
      error: "আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে।"
    });
  }

  const withdrawAmount = Number(amount);

  if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({
      error: "সঠিক পরিমাণ লিখুন"
    });
  }

  if (withdrawAmount < db.settings.minWithdrawal) {
    return res.status(400).json({
      error: `সর্বনিম্ন উইথড্র ${db.settings.minWithdrawal} টাকা`
    });
  }

  if (withdrawAmount > db.settings.maxWithdrawal) {
    return res.status(400).json({
      error: `সর্বোচ্চ উইথড্র ${db.settings.maxWithdrawal} টাকা`
    });
  }

  if (!db.settings.allowedGateways.includes(gateway)) {
    return res.status(400).json({
      error: "এই পেমেন্ট মাধ্যমটি বর্তমানে অনুমোদিত নয়"
    });
  }

  if (user.balance < withdrawAmount) {
    return res.status(400).json({
      error: "আপনার ব্যালেন্স পর্যাপ্ত নয়"
    });
  }

  // Prevent multiple pending withdrawals
  const pendingWithdrawal = db.withdrawals.find(
    (w) =>
      w.userTelegramId === tid &&
      w.status === "pending"
  );

  if (pendingWithdrawal) {
    return res.status(400).json({
      error:
        "আপনার একটি উইথড্র রিকোয়েস্ট ইতোমধ্যে পেন্ডিং রয়েছে।"
    });
  }

  // Deduct balance immediately and hold it
  user.balance -= withdrawAmount;

  const withdrawal: Withdrawal = {
    id: `wd-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`,
    userTelegramId: tid,
    username: user.username,
    amount: withdrawAmount,
    gateway,
    accountNumber: String(accountNumber),
    accountName: accountName || user.firstName,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  db.withdrawals.push(withdrawal);

  const transaction: Transaction = {
    id: `tx-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`,
    userTelegramId: tid,
    type: "withdrawal",
    amount: -withdrawAmount,
    description: `উইথড্র রিকোয়েস্ট (${gateway})`,
    referenceId: withdrawal.id,
    createdAt: new Date().toISOString()
  };

  db.transactions.push(transaction);

  saveDatabase(db);

  return res.json({
    success: true,
    message:
      "আপনার উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে।",
    withdrawal,
    user
  });
});// Admin authentication
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      error: "পাসওয়ার্ড দিন"
    });
  }

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "ভুল অ্যাডমিন পাসওয়ার্ড"
    });
  }

  return res.json({
    success: true,
    message: "অ্যাডমিন লগইন সফল হয়েছে"
  });
});

// Admin dashboard data
app.get("/api/admin/dashboard", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const users = Object.values(db.users);

  const totalBalance = users.reduce(
    (sum, user) => sum + Number(user.balance || 0),
    0
  );

  const totalUsers = users.length;

  const pendingSubmissions = db.submissions.filter(
    (submission) => submission.status === "pending"
  ).length;

  const pendingWithdrawals = db.withdrawals.filter(
    (withdrawal) => withdrawal.status === "pending"
  ).length;

  const totalWithdrawals = db.withdrawals.reduce(
    (sum, withdrawal) =>
      sum + Number(withdrawal.amount || 0),
    0
  );

  return res.json({
    success: true,
    stats: {
      totalUsers,
      totalBalance,
      pendingSubmissions,
      pendingWithdrawals,
      totalWithdrawals
    }
  });
});

// Admin: get all users
app.get("/api/admin/users", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const users = Object.values(db.users).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return res.json({
    success: true,
    users
  });
});

// Admin: get all tasks
app.get("/api/admin/tasks", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  return res.json({
    success: true,
    tasks: db.tasks
  });
});

// Admin: create task
app.post("/api/admin/tasks", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const {
    title,
    description,
    instructions,
    link,
    reward,
    proofRequired,
    category
  } = req.body;

  if (!title || !description || !reward) {
    return res.status(400).json({
      error: "প্রয়োজনীয় তথ্য পূরণ করুন"
    });
  }

  const task: Task = {
    id: `task-${Date.now()}`,
    title: String(title),
    description: String(description),
    instructions: String(instructions || ""),
    link: String(link || ""),
    reward: Number(reward),
    proofRequired: Boolean(proofRequired),
    active: true,
    category: String(category || "Other"),
    createdAt: new Date().toISOString()
  };

  db.tasks.push(task);
  saveDatabase(db);

  return res.json({
    success: true,
    task
  });
});

// Admin: update task
app.put("/api/admin/tasks/:id", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const task = db.tasks.find(
    (item) => item.id === req.params.id
  );

  if (!task) {
    return res.status(404).json({
      error: "কাজটি পাওয়া যায়নি"
    });
  }

  Object.assign(task, req.body);

  saveDatabase(db);

  return res.json({
    success: true,
    task
  });
});

// Admin: delete task
app.delete("/api/admin/tasks/:id", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const index = db.tasks.findIndex(
    (task) => task.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      error: "কাজটি পাওয়া যায়নি"
    });
  }

  db.tasks.splice(index, 1);
  saveDatabase(db);

  return res.json({
    success: true,
    message: "কাজটি মুছে ফেলা হয়েছে"
  });
});// Admin: get task submissions
app.get("/api/admin/submissions", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const submissions = [...db.submissions].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return res.json({
    success: true,
    submissions
  });
});

// Admin: approve or reject submission
app.put("/api/admin/submissions/:id", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const { status, adminNote } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status"
    });
  }

  const submission = db.submissions.find(
    (item) => item.id === req.params.id
  );

  if (!submission) {
    return res.status(404).json({
      error: "Submission পাওয়া যায়নি"
    });
  }

  if (submission.status !== "pending") {
    return res.status(400).json({
      error: "এই submission ইতোমধ্যে processed হয়েছে"
    });
  }

  const user = db.users[submission.userTelegramId];

  if (!user) {
    return res.status(404).json({
      error: "ইউজার পাওয়া যায়নি"
    });
  }

  submission.status = status;
  submission.adminNote = adminNote || "";
  submission.reviewedAt = new Date().toISOString();

  if (status === "approved") {
    const reward = Number(submission.reward || 0);

    user.balance += reward;

    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
      userTelegramId: user.telegramId,
      type: "task_reward",
      amount: reward,
      description: `কাজের রিওয়ার্ড: ${submission.taskTitle}`,
      referenceId: submission.id,
      createdAt: new Date().toISOString()
    };

    db.transactions.push(transaction);
  }

  saveDatabase(db);

  return res.json({
    success: true,
    message:
      status === "approved"
        ? "Submission approved এবং reward যোগ হয়েছে।"
        : "Submission rejected হয়েছে।",
    submission,
    user
  });
});

// Admin: get withdrawals
app.get("/api/admin/withdrawals", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const withdrawals = [...db.withdrawals].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return res.json({
    success: true,
    withdrawals
  });
});

// Admin: approve or reject withdrawal
app.put("/api/admin/withdrawals/:id", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const { status, adminNote } = req.body;

  if (!["paid", "rejected"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status"
    });
  }

  const withdrawal = db.withdrawals.find(
    (item) => item.id === req.params.id
  );

  if (!withdrawal) {
    return res.status(404).json({
      error: "Withdrawal পাওয়া যায়নি"
    });
  }

  if (withdrawal.status !== "pending") {
    return res.status(400).json({
      error: "এই withdrawal ইতোমধ্যে processed হয়েছে"
    });
  }

  const user = db.users[withdrawal.userTelegramId];

  if (!user) {
    return res.status(404).json({
      error: "ইউজার পাওয়া যায়নি"
    });
  }

  withdrawal.status = status;
  withdrawal.adminNote = adminNote || "";
  withdrawal.reviewedAt = new Date().toISOString();

  // If rejected, return the money to the user's balance.
  if (status === "rejected") {
    user.balance += Number(withdrawal.amount || 0);

    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
      userTelegramId: user.telegramId,
      type: "withdrawal_refund",
      amount: Number(withdrawal.amount || 0),
      description: "Withdrawal rejected — balance refunded",
      referenceId: withdrawal.id,
      createdAt: new Date().toISOString()
    };

    db.transactions.push(transaction);
  }

  saveDatabase(db);

  return res.json({
    success: true,
    message:
      status === "paid"
        ? "Withdrawal paid হিসেবে mark করা হয়েছে।"
        : "Withdrawal rejected এবং balance ফেরত দেওয়া হয়েছে।",
    withdrawal,
    user
  });
});

// Admin: update user balance
app.put("/api/admin/users/:telegramId/balance", (req, res) => {
  const password = String(req.headers["x-admin-password"] || "");

  if (password !== db.adminPassword) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const tid = String(req.params.telegramId);
  const user = db.users[tid];

  if (!user) {
    return res.status(404).json({
      error: "ইউজার পাওয়া যায়নি"
    });
  }

  const amount = Number(req.body.amount);
  const description = String(
    req.body.description || "Admin balance adjustment"
  );

  if (!Number.isFinite(amount)) {
    return res.status(400).json({
      error: "সঠিক amount দিন"
    });
  }

  user.balance += amount;

  const transaction: Transaction = {
    id: `tx-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`,
    userTelegramId: tid,
    type: "admin_adjustment",
    amount,
    description,
    createdAt: new Date().toISOString()
  };

  db.transactions.push(transaction);

  saveDatabase(db);

  return res.json({
    success: true,
    user,
    transaction
  });
});        referredBy = referrer.telegramId;
        // Create referral record
        const newRefRecord: ReferralItem = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          referrerTelegramId: referrer.telegramId,
          referredTelegramId: tid,
          referredUsername: username || "User",
          referredName: `${firstName || ""} ${lastName || ""}`.trim(),
          reward: db.settings.referralReward,
          status: "pending",
          createdAt: new Date().toISOString()
        };
        db.referrals.push(newRefRecord);

        // Update referrer's referral count
        referrer.referralsCount = (referrer.referralsCount || 0) + 1;
      }
    }

    user = {
      telegramId: tid,
      username: username || `user_${tid.slice(-4)}`,
      firstName: firstName || "User",
      lastName: lastName || "",
      photoUrl: photoUrl || "",
      balance: 0,
      referralCode: myRefCode,
      referredBy,
      createdAt: new Date().toISOString(),
      totalEarned: 0,
      completedTasksCount: 0,
      referralsCount: 0,
      referralEarnings: 0,
      status: "active",
      role: "user"
    };

    db.users[tid] = user;
    saveDatabase(db);
  } else {
    if (username && user.username !== username) user.username = username;
    if (firstName && user.firstName !== firstName) user.firstName = firstName;
    if (photoUrl && user.photoUrl !== photoUrl) user.photoUrl = photoUrl;
    saveDatabase(db);
  }

  return res.json({ success: true, user });
});

// Get user profile with live stats
app.get("/api/user/profile/:telegramId", (req, res) => {
  const tid = String(req.params.telegramId);
  const user = db.users[tid];

  if (!user) {
    return res.status(404).json({ error: "ইউজার পাওয়া যায়নি" });
  }

  return res.json({ success: true, user });
});

// Get tasks list with user's individual submission status
app.get("/api/tasks", (req, res) => {
  const tid = req.query.telegramId ? String(req.query.telegramId) : null;

  const activeTasks = db.tasks.filter((t) => t.active);

  const mappedTasks = activeTasks.map((task) => {
    let userSubmission = null;
    if (tid) {
      userSubmission = db.submissions.find(
        (s) => s.taskId === task.id && s.userTelegramId === tid
      );
    }

    return {
      ...task,
      userStatus: userSubmission ? userSubmission.status : "available",
      submission: userSubmission || null
    };
  });

  return res.json({ success: true, tasks: mappedTasks });
});

// Submit task proof
app.post("/api/tasks/submit", (req, res) => {
  if (db.settings.maintenanceMode) {
    return res.status(503).json({
      error: "সাইট বর্তমানে মেইনটেন্যান্স মোডে আছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।"
    });
  }

  const { taskId, telegramId, proofText, proofImage } = req.body;

  if (!taskId || !telegramId || !proofText) {
    return res.status(400).json({
      error: "সকল প্রয়োজনীয় ঘর পূরণ করুন"
    });
  }

  const tid = String(telegramId);
  const user = db.users[tid];

  if (!user) {
    return res.status(404).json({
      error: "ইউজার পাওয়া যায়নি"
    });
  }

  if (user.status === "banned") {
    return res.status(403).json({
      error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) রাখা হয়েছে।"
    });
  }

  const task = db.tasks.find((t) => t.id === taskId);

  if (!task || !task.active) {
    return res.status(400).json({
      error: "টাস্কটি বর্তমানে সক্রিয় নয়"
    });
  }

  // Check duplicate submission
  const existingSub = db.submissions.find(
    (s) => s.taskId === taskId && s.userTelegramId === tid
  );

  if (existingSub) {
    if (existingSub.status === "pending") {
      return res.status(400).json({
        error: "আপনার জমা দেওয়া প্রুফ বর্তমানে পেন্ডিং রয়েছে"
      });
    }

    if (existingSub.status === "approved") {
      return res.status(400).json({
        error: "আপনি এই কাজটি ইতোমধ্যে সম্পন্ন করেছেন"
      });
    }
  }

  const newSubmission: TaskSubmission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    taskId: task.id,
    taskTitle: task.title,
    reward: task.reward,
    userTelegramId: tid,
    username: user.username,
    proofText: proofText.trim(),
    proofImage: proofImage || "",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  db.submissions.push(newSubmission);
  saveDatabase(db);

  return res.json({
    success: true,
    message:
      "আপনার প্রুফ সফলভাবে জমা হয়েছে! অ্যাডমিন পর্যালোচনার পর রিওয়ার্ড যোগ হবে।",
    submission: newSubmission
  });
});

// Request Withdrawal
app.post("/api/withdraw", (req, res) => {
  if (db.settings.maintenanceMode) {
    return res.status(503).json({
      error: "সাইট বর্তমানে মেইনটেন্যান্স মোডে আছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।"
    });
  }

  const {
    telegramId,
    amount,
    paymentMethod,
    accountNumber
  } = req.body;

  if (!telegramId || !amount || !paymentMethod || !accountNumber) {
    return res.status(400).json({
      error: "সকল প্রয়োজনীয় ঘর পূরণ করুন"
    });
  }

  const tid = String(telegramId);
  const user = db.users[tid];

  if (!user) {
    return res.status(404).json({
      error: "ইউজার পাওয়া যায়নি"
    });
  }

  if (user.status === "banned") {
    return res.status(403).json({
      error:
        "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) রাখা হয়েছে।"
    });
  }

  const withdrawAmount = Number(amount);

  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({
      error: "সঠিক টাকার পরিমাণ দিন"
    });
  }

  const minWd = db.settings.minWithdrawal || 100;
  const maxWd = db.settings.maxWithdrawal || 5000;

  if (withdrawAmount < minWd) {
    return res.status(400).json({
      error: `সর্বনিম্ন উত্তোলনের পরিমাণ ৳${minWd.toFixed(2)}`
    });
  }

  if (withdrawAmount > maxWd) {
    return res.status(400).json({
      error: `সর্বোচ্চ উত্তোলনের পরিমাণ ৳${maxWd.toFixed(2)}`
    });
  }

  if (user.balance < withdrawAmount) {
    return res.status(400).json({
      error: "আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই"
    });
  }

  const allowedGateways =
    db.settings.allowedGateways || ["bkash", "nagad", "rocket"];

  if (!allowedGateways.includes(paymentMethod.toLowerCase())) {
    return res.status(400).json({
      error: "সঠিক ও অনুমোদিত পেমেন্ট মেথড নির্বাচন করুন"
    });// Announcements CRUD
app.get("/api/admin/announcements", requireAdmin, (req, res) => {
  const anns = db.announcements || db.settings.announcements || [];
  return res.json({ success: true, announcements: anns });
});

app.post("/api/admin/announcements", requireAdmin, (req, res) => {
  const { title, description, link, active } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "ঘোষণার শিরোনাম ও বিবরণ আবশ্যক" });
  }

  const newAnn: Announcement = {
    id: `ann-${Date.now()}`,
    title: title.trim(),
    description: description.trim(),
    link: link ? link.trim() : "",
    active: active ?? true,
    createdAt: new Date().toISOString()
  };

  if (!db.announcements) db.announcements = [];
  db.announcements.unshift(newAnn);

  logAdminAction("Super Admin", "Announcement Create", `Title: ${newAnn.title}`);

  saveDatabase(db);
  return res.json({ success: true, announcement: newAnn });
});

app.put("/api/admin/announcements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (!db.announcements) db.announcements = [];

  const idx = db.announcements.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "ঘোষণা পাওয়া যায়নি" });

  db.announcements[idx] = {
    ...db.announcements[idx],
    ...req.body
  };

  logAdminAction("Super Admin", "Announcement Edit", `ID: ${id}`);

  saveDatabase(db);
  return res.json({ success: true, announcement: db.announcements[idx] });
});

app.delete("/api/admin/announcements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (db.announcements) {
    db.announcements = db.announcements.filter((a) => a.id !== id);
    saveDatabase(db);
  }
  logAdminAction("Super Admin", "Announcement Delete", `ID: ${id}`);
  return res.json({ success: true, message: "ঘোষণা মুছে ফেলা হয়েছে" });
});

// Transactions list endpoint for Admin
app.get("/api/admin/transactions", requireAdmin, (req, res) => {
  const sortedTxs = [...db.transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.json({ success: true, transactions: sortedTxs });
});

// Activity logs endpoint for Admin
app.get("/api/admin/logs", requireAdmin, (req, res) => {
  const sortedLogs = [...(db.adminLogs || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.json({ success: true, logs: sortedLogs });
});

// Admin Settings Update
app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const {
    siteName,
    siteLogo,
    announcementNotice,
    minWithdrawal,
    maxWithdrawal,
    referralReward,
    referralActive,
    whatsappSupport,
    telegramSupport,
    maintenanceMode,
    allowedGateways,
    adminPassword,
    adsEnabled
  } = req.body;

  if (siteName) db.settings.siteName = siteName.trim();
  if (siteLogo !== undefined) db.settings.siteLogo = siteLogo.trim();
  if (announcementNotice !== undefined) db.settings.announcementNotice = announcementNotice.trim();
  if (minWithdrawal !== undefined) db.settings.minWithdrawal = Number(minWithdrawal);
  if (maxWithdrawal !== undefined) db.settings.maxWithdrawal = Number(maxWithdrawal);
  if (referralReward !== undefined) db.settings.referralReward = Number(referralReward);
  if (referralActive !== undefined) db.settings.referralActive = Boolean(referralActive);
  if (whatsappSupport) db.settings.whatsappSupport = whatsappSupport.trim();
  if (telegramSupport) db.settings.telegramSupport = telegramSupport.trim();
  if (maintenanceMode !== undefined) db.settings.maintenanceMode = Boolean(maintenanceMode);
  if (allowedGateways && Array.isArray(allowedGateways)) db.settings.allowedGateways = allowedGateways;
  if (adsEnabled !== undefined) db.settings.adsEnabled = Boolean(adsEnabled);

  if (adminPassword && adminPassword.trim().length >= 4) {
    db.adminPassword = adminPassword.trim();
    logAdminAction("Super Admin", "Password Change", "Security", "অ্যাডমিন পাসওয়ার্ড পরিবর্তন করা হয়েছে");
  }

  logAdminAction("Super Admin", "Settings Update", "System Settings", "সাইট ও পেমেন্ট সেটিংস আপডেট করা হয়েছে");

  saveDatabase(db);
  return res.json({ success: true, settings: db.settings });
});

// Admin Ads CRUD (Future Ad System)
app.post("/api/admin/ads", requireAdmin, (req, res) => {
  const { title, imageUrl, link, rewardMessage, active } = req.body;

  if (!title || !link) {
    return res.status(400).json({ error: "বিজ্ঞাপনের শিরোনাম ও লিংক আবশ্যক" });
  }

  const newAd: Advertisement = {
    id: `ad-${Date.now()}`,
    title: title.trim(),
    imageUrl: imageUrl || "",
    link: link.trim(),
    rewardMessage: rewardMessage || "",
    active: active ?? true,
    createdAt: new Date().toISOString()
  };

  if (!db.settings.ads) db.settings.ads = [];
  db.settings.ads.unshift(newAd);

  saveDatabase(db);
  return res.json({ success: true, ad: newAd });
});

app.delete("/api/admin/ads/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (db.settings.ads) {
    db.settings.ads = db.settings.ads.filter((a) => a.id !== id);
    saveDatabase(db);
  }
  return res.json({ success: true, message: "বিজ্ঞাপন মুছে ফেলা হয়েছে" });
});

// =========================================
// VITE MIDDLEWARE & SERVER BOOTSTRAP
// =========================================

async function startServer() {
  try {
    await ensureServerAdminAuth(db.adminPassword || "nexora2026admin");
    const remoteData = await loadInitialDataFromFirestore();

    if (remoteData) {
      if (remoteData.users && Object.keys(remoteData.users).length > 0) {
        db.users = { ...db.users, ...remoteData.users };
      }

      if (remoteData.tasks && remoteData.tasks.length > 0) {
        db.tasks = remoteData.tasks;
      }

      if (remoteData.submissions && remoteData.submissions.length > 0) {
        db.submissions = remoteData.submissions;
      }

      if (remoteData.withdrawals && remoteData.withdrawals.length > 0) {
        db.withdrawals = remoteData.withdrawals;
      }

      if (remoteData.referrals && remoteData.referrals.length > 0) {
        db.referrals = remoteData.referrals;
  }

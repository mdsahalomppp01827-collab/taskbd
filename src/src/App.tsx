/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { User, Task, AppSettings, Transaction, TaskSubmission, Withdrawal } from './types';
import {
  initTelegramWebApp,
  getTelegramUser,
  getStartParam,
} from './lib/telegram';
import {
  syncUserAPI,
  getUserProfileAPI,
  getTasksAPI,
  getUserHistoryAPI,
  getAppSettingsAPI,
} from './lib/api';

import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { TasksView } from './components/TasksView';
import { ReferralView } from './components/ReferralView';
import { WithdrawView } from './components/WithdrawView';
import { ProfileView } from './components/ProfileView';
import { SupportModal } from './components/SupportModal';
import { AdminPanel } from './components/AdminPanel';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<(Task & { userStatus?: string; submission?: any })[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // User history logs
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referralsList, setReferralsList] = useState<any[]>([]);

  // Modals state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Loading, error & refresh state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Telegram ID being tracked
  const [activeTelegramId, setActiveTelegramId] = useState<string>('987654321');

  // Load user data and settings
  const loadUserData = useCallback(async (telegramId: string) => {
    try {
      setErrorMessage(null);
      const [profileRes, tasksRes, historyRes, settingsRes] = await Promise.all([
        getUserProfileAPI(telegramId),
        getTasksAPI(telegramId),
        getUserHistoryAPI(telegramId),
        getAppSettingsAPI(),
      ]);

      if (profileRes.user) {
        setCurrentUser(profileRes.user);
      }

      if (tasksRes.tasks) {
        setTasks(tasksRes.tasks);
      }

      if (historyRes.success) {
        setTransactions(historyRes.transactions || []);
        setSubmissions(historyRes.submissions || []);
        setWithdrawals(historyRes.withdrawals || []);
        setReferralsList(historyRes.referrals || []);
      }

      if (settingsRes.settings) {
        setSettings(settingsRes.settings);
      }
    } catch (err: any) {
      console.error("Error loading app data:", err);
      setErrorMessage("Firestore বা সার্ভারের সাথে সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  }, []);

  // Initialize App on mount
  useEffect(() => {
    initTelegramWebApp();

    const tgUser = getTelegramUser();
    const startParam = getStartParam();

    let targetTid = '987654321'; // Default demo user if opened outside Telegram
    let tgUsername = 'nexora_user';
    let tgFirstName = 'Nexora';
    let tgLastName = 'Member';
    let tgPhoto = '';

    if (tgUser) {
      targetTid = String(tgUser.id);
      tgUsername = tgUser.username || `user_${targetTid.slice(-4)}`;
      tgFirstName = tgUser.first_name || 'Nexora';
      tgLastName = tgUser.last_name || '';
      tgPhoto = tgUser.photo_url || '';
    }

    setActiveTelegramId(targetTid);

    // Initial Sync with server and Firestore
    syncUserAPI({
      telegramId: targetTid,
      username: tgUsername,
      firstName: tgFirstName,
      lastName: tgLastName,
      photoUrl: tgPhoto,
      referralCodeInput: startParam || undefined,
    }).then((res) => {
      if (res.user) {
        setCurrentUser(res.user);
      }
      loadUserData(targetTid).finally(() => setIsLoading(false));
    }).catch((err) => {
      console.error("Sync user error:", err);
      setErrorMessage("সার্ভারে ইউজার সিংক্রোনাইজ করতে ব্যর্থ হয়েছে।");
      setIsLoading(false);
    });
  }, [loadUserData]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserData(activeTelegramId);
    setIsRefreshing(false);
  };

  // Demo user switcher
  const handleSwitchUser = async (customId: string) => {
    setIsLoading(true);
    setActiveTelegramId(customId);
    await syncUserAPI({
      telegramId: customId,
      username: `user_${customId.slice(-4)}`,
      firstName: `User ${customId.slice(-4)}`,
    });
    await loadUserData(customId);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#        <div className="mx-4 mt-3 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-center justify-between gap-2 shadow-lg">
          <span>{errorMessage}</span>
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1 bg-red-800 hover:bg-red-700 active:scale-95 text-white font-medium rounded-lg text-[11px] transition shrink-0"
          >
            পুনরায় চেষ্টা
          </button>
        </div>
      )}

      {/* View Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            user={currentUser}
            tasks={tasks}
            settings={settings}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSupport={() => setIsSupportModalOpen(true)}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            telegramId={activeTelegramId}
            tasks={tasks}
            onRefreshTasks={handleRefresh}
          />
        )}

        {activeTab === 'referral' && (
          <ReferralView
            user={currentUser}
            settings={settings}
            referralsList={referralsList}
          />
        )}

        {activeTab === 'withdraw' && (
          <WithdrawView
            user={currentUser}
            settings={settings}
            withdrawalsHistory={withdrawals}
            onRefreshData={handleRefresh}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={currentUser}
            transactions={transactions}
            submissions={submissions}
            withdrawals={withdrawals}
            onOpenSupport={() => setIsSupportModalOpen(true)}
            onOpenAdmin={() => setIsAdminPanelOpen(true)}
            onSwitchUser={handleSwitchUser}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingTasksCount={pendingCount}
      />

      {/* Support Modal */}
      {isSupportModalOpen && (
        <SupportModal
          whatsappNumber={settings?.whatsappSupport || '01827389336'}
          telegramUsername={settings?.telegramSupport || '@NexoraEarn'}
          onClose={() => setIsSupportModalOpen(false)}
        />
      )}

      {/* Admin Panel Overlay */}
      {isAdminPanelOpen && (
        <AdminPanel
          onClose={() => setIsAdminPanelOpen(false)}
          onRefreshParentData={handleRefresh}
        />
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Battery,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Copy,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  User,
  Wallet,
  Wifi,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useDashboardStats,
  useUpdateDashboardStats,
} from "../hooks/useQueries";

const GOLD = "#D4AF37";
// DEPOSIT_AMOUNT removed - using selectedDepositAmount state
const SERVERS = ["1xbet", "Stake", "BDGGame"];
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const UPI_ID = "pubgopop@freecharge";

const goldenCard = {
  border: `1.5px solid ${GOLD}55`,
  boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(212,175,55,0.15)",
  background: "#ffffff",
};

type UpiEntry = {
  upiId: string;
  todayCommission: number;
  totalCommission: number;
};

type LiveTx = {
  id: string;
  server: string;
  upiId: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  timeLabel: string;
};

function formatAmount(val: number) {
  return `\u20b9${val.toFixed(2)}`;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function randomServer() {
  return SERVERS[Math.floor(Math.random() * SERVERS.length)];
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function loadUserEntries(username: string): UpiEntry[] {
  try {
    const raw = localStorage.getItem(`bppay_upi_entries_${username}`);
    if (raw) return JSON.parse(raw) as UpiEntry[];
  } catch {}
  return [];
}

function saveUserEntries(username: string, entries: UpiEntry[]) {
  localStorage.setItem(
    `bppay_upi_entries_${username}`,
    JSON.stringify(entries),
  );
}

function loadUserStats(username: string) {
  try {
    const raw = localStorage.getItem(`bppay_stats_${username}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveUserStats(username: string, stats: object) {
  localStorage.setItem(`bppay_stats_${username}`, JSON.stringify(stats));
}

function SpinnerIcon() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function StatusBar() {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="flex items-center justify-between px-4"
      style={{ background: "#1565C0", height: 24 }}
    >
      <span className="text-white text-[11px] font-semibold tracking-wide">
        {time}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-white text-[10px]">●●●</span>
        <Wifi className="w-3 h-3 text-white" />
        <Battery className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  );
}

type DepositStep = 1 | 2 | 3;

interface DashboardProps {
  onLogout?: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const currentUsername =
    localStorage.getItem("bppay_current_user") || "default";
  const [entries, setEntries] = useState<UpiEntry[]>(() =>
    loadUserEntries(currentUsername),
  );
  const [addUpiOpen, setAddUpiOpen] = useState(false);
  const [newUpiId, setNewUpiId] = useState("");

  const [promoOpen, setPromoOpen] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<DepositStep>(1);
  const [selectedDepositAmount, setSelectedDepositAmount] = useState<
    500 | 1000
  >(500);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_copied, _setCopied] = useState(false);

  const [isOnline, setIsOnline] = useState(false);
  const [tpsCount, setTpsCount] = useState(0);
  const [liveTransactions, setLiveTransactions] = useState<LiveTx[]>([]);
  const [withdrawalMs, setWithdrawalMs] = useState<number | null>(() => {
    const saved = localStorage.getItem(`bppay_withdrawal_${currentUsername}`);
    return saved ? Number(saved) : null;
  });
  const withdrawReady = withdrawalMs !== null && withdrawalMs <= 0;

  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositLoadingCount, setDepositLoadingCount] = useState(30);
  const [realDepositPopup, setRealDepositPopup] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [chatMessages, setChatMessages] = useState<
    { id: number; from: "bot" | "user"; text: string }[]
  >([
    {
      id: 0,
      from: "bot",
      text: "Hi! Welcome to BP•PAY Support 👋 How can I help you today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleBtnClick = (ocid: string, action: () => void) => {
    setLoadingBtn(ocid);
    setTimeout(() => {
      action();
      setLoadingBtn(null);
    }, 1200);
  };

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const [localStats, setLocalStats] = useState(() => {
    const saved = loadUserStats(currentUsername);
    return (
      saved || {
        totalCurrentBalance: 300,
        lockedDeposit: 0,
        todayCommission: 0,
        transferIn: 0,
        transferOut: 0,
      }
    );
  });

  useEffect(() => {
    if (statsData) {
      setLocalStats({
        totalCurrentBalance: statsData.totalCurrentBalance,
        lockedDeposit: statsData.lockedDeposit,
        todayCommission: statsData.todayCommission,
        transferIn: statsData.transferIn,
        transferOut: statsData.transferOut,
      });
    }
  }, [statsData]);

  useEffect(() => {
    saveUserStats(currentUsername, localStats);
  }, [localStats, currentUsername]);

  useEffect(() => {
    if (withdrawalMs !== null) {
      localStorage.setItem(
        `bppay_withdrawal_${currentUsername}`,
        String(withdrawalMs),
      );
    } else {
      localStorage.removeItem(`bppay_withdrawal_${currentUsername}`);
    }
  }, [withdrawalMs, currentUsername]);

  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const updateStatsMutation = useUpdateDashboardStats();
  const updateMutateRef = useRef(updateStatsMutation.mutate);
  useEffect(() => {
    updateMutateRef.current = updateStatsMutation.mutate;
  }, [updateStatsMutation.mutate]);

  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const withdrawTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const twentyDropRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopOnline = useCallback(() => {
    if (onlineTimerRef.current) clearInterval(onlineTimerRef.current);
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    if (withdrawTimerRef.current) clearInterval(withdrawTimerRef.current);
    if (twentyDropRef.current) clearInterval(twentyDropRef.current);
    onlineTimerRef.current = null;
    syncTimerRef.current = null;
    withdrawTimerRef.current = null;
    twentyDropRef.current = null;
  }, []);

  const getUpiId = useCallback(() => {
    const e = entriesRef.current;
    if (e.length > 0) return e[Math.floor(Math.random() * e.length)].upiId;
    return "user@upi";
  }, []);

  useEffect(() => {
    if (!isOnline) {
      stopOnline();
      setTpsCount(0);
      setWithdrawalMs(null);
      return stopOnline;
    }

    const startTs = Date.now();
    setWithdrawalMs(THREE_HOURS_MS);

    onlineTimerRef.current = setInterval(() => {
      setLocalStats((prev) => {
        const increase = prev.lockedDeposit * 0.001;
        const server = randomServer();
        const upi = getUpiId();
        const tl = nowLabel();
        const id = Date.now().toString();

        setTpsCount((c) => c + 1);
        setLiveTransactions((txs) =>
          [
            {
              id: `${id}c`,
              server,
              upiId: upi,
              amount: increase,
              type: "CREDIT" as const,
              timeLabel: tl,
            },
            {
              id: `${id}d`,
              server,
              upiId: upi,
              amount: increase,
              type: "DEBIT" as const,
              timeLabel: tl,
            },
            ...txs,
          ].slice(0, 60),
        );

        // Update UPI entry commissions for the matched UPI ID
        setEntries((prevEntries) => {
          if (prevEntries.length === 0) return prevEntries;
          const idx = prevEntries.findIndex((e) => e.upiId === upi);
          if (idx === -1) return prevEntries;
          const updated = [...prevEntries];
          updated[idx] = {
            ...updated[idx],
            todayCommission: updated[idx].todayCommission + increase,
            totalCommission: updated[idx].totalCommission + increase,
          };
          saveUserEntries(currentUsername, updated);
          return updated;
        });

        const newBalance = prev.totalCurrentBalance + increase;
        const newLocked = prev.lockedDeposit + increase;

        // Balance cycle: grow to 3500, drop to 2000, repeat until 3 hrs
        let finalBalance = newBalance;
        let finalLocked = newLocked;
        if (newBalance >= 3500) {
          finalBalance = 2000;
          finalLocked = 2000;
        }

        return {
          ...prev,
          lockedDeposit: finalLocked,
          totalCurrentBalance: finalBalance,
          todayCommission: prev.todayCommission + increase,
          transferIn: prev.transferIn + increase,
          transferOut: prev.transferOut + increase,
        };
      });
    }, 1000);

    // ₹20 permanent deduction every 120 seconds
    twentyDropRef.current = setInterval(() => {
      const server = randomServer();
      const upi = getUpiId();
      const tl = nowLabel();
      const id = Date.now().toString();
      setLiveTransactions((txs) =>
        [
          {
            id: `${id}d20`,
            server,
            upiId: upi,
            amount: 20,
            type: "DEBIT" as const,
            timeLabel: tl,
          },
          ...txs,
        ].slice(0, 60),
      );
      setLocalStats((prev) => ({
        ...prev,
        lockedDeposit: Math.max(0, prev.lockedDeposit - 20),
        totalCurrentBalance: Math.max(0, prev.totalCurrentBalance - 20),
        transferOut: prev.transferOut + 20,
      }));
    }, 120000);

    withdrawTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTs;
      const remaining = THREE_HOURS_MS - elapsed;
      setWithdrawalMs(remaining);
    }, 1000);

    syncTimerRef.current = setInterval(() => {
      setLocalStats((prev) => {
        updateMutateRef.current(prev);
        saveUserStats(currentUsername, prev);
        return prev;
      });
    }, 10000);

    return stopOnline;
  }, [isOnline, stopOnline, getUpiId, currentUsername]);

  useEffect(() => () => stopOnline(), [stopOnline]);

  const handleAddUpi = () => {
    if (!newUpiId.trim()) {
      toast.error("Please enter a UPI ID");
      return;
    }
    const trimmed = newUpiId.trim();
    if (entries.some((e) => e.upiId === trimmed)) {
      toast.error("This UPI ID already exists");
      return;
    }
    const newEntry: UpiEntry = {
      upiId: trimmed,
      todayCommission: 0,
      totalCommission: 0,
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    saveUserEntries(currentUsername, updated);
    toast.success("UPI ID added successfully");
    setAddUpiOpen(false);
    setNewUpiId("");
  };

  const handleDelete = (upiId: string) => {
    const updated = entries.filter((e) => e.upiId !== upiId);
    setEntries(updated);
    saveUserEntries(currentUsername, updated);
    toast.success("UPI ID removed");
  };

  const _handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    _setCopied(true);
    setTimeout(() => _setCopied(false), 2000);
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
    }
  };

  const handleConfirmDeposit = () => {
    if (!utrNumber.trim() || utrNumber.length < 10) {
      toast.error("Please enter a valid UTR number (min 10 digits)");
      return;
    }
    if (!screenshotFile) {
      toast.error("Please upload payment screenshot");
      return;
    }
    const amount = selectedDepositAmount;
    setDepositOpen(false);
    setDepositStep(1);
    setUtrNumber("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setDepositLoading(true);
    setDepositLoadingCount(30);
    let count = 30;
    const interval = setInterval(() => {
      count -= 1;
      setDepositLoadingCount(count);
      if (count <= 0) {
        clearInterval(interval);
        setDepositLoading(false);
        const credited = amount === 1000 ? 1400 : 500;
        setLocalStats((prev) => ({
          ...prev,
          lockedDeposit: prev.lockedDeposit + credited,
          totalCurrentBalance: prev.totalCurrentBalance + credited,
        }));
        toast.success(
          amount === 1000
            ? "₹1400 credited! (₹1000 + ₹400 bonus)"
            : "₹500 deposited! Funds added to Locked Balance.",
        );
        setRealDepositPopup(true);
      }
    }, 1000);
  };

  const openDeposit = () => {
    setDepositStep(1);
    setSelectedDepositAmount(500);
    setUtrNumber("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setDepositOpen(true);
  };

  const closeDeposit = () => {
    setDepositOpen(false);
    setTimeout(() => setDepositStep(1), 300);
  };

  const sendChatMessage = (msg: string) => {
    const lower = msg.toLowerCase();
    let reply =
      "Our support team will resolve your issue within 3 hours (3hr TAT). Please describe your issue in detail.";
    if (lower.includes("withdraw")) {
      reply =
        "Withdrawals are processed within 3 hours of your request. Withdrawal goes to the same UPI used for deposit.";
    } else if (lower.includes("deposit")) {
      reply =
        "Your deposit will be credited within 30 seconds after UTR confirmation. Use the Deposit button to proceed.";
    } else if (lower.includes("upi")) {
      reply =
        "Go to the main page, tap 'Add UPI' to add your UPI ID. You need at least one UPI ID to go Online.";
    } else if (lower.includes("commission")) {
      reply =
        "Commission is earned on every transaction while you are Online. Check 'My UPI Transactions' for live updates.";
    } else if (lower.includes("issue") || lower.includes("problem")) {
      reply =
        "Your issue has been noted. Expected resolution time: 3 hours. Thank you for your patience.";
    } else if (
      lower.includes("help") ||
      lower.includes("hello") ||
      lower.includes("hi")
    ) {
      reply =
        "Sure! I can help with withdrawals, deposits, UPI IDs, commissions, and more. What would you like to know?";
    }
    setChatMessages((prev) => [
      ...prev,
      { id: prev.length, from: "user" as const, text: msg },
      { id: prev.length + 1, from: "bot" as const, text: reply },
    ]);
    setChatInput("");
  };

  const tutorialSteps = [
    {
      icon: "📱",
      title: "Step 1: Add Your UPI ID",
      color: "#1565C0",
      content:
        "To start earning, go to the 'Add UPI' section on the main page. Tap the button and enter your UPI ID (e.g. name@upi). You need at least one UPI ID to activate Go Online mode and start earning commissions.",
      tips: [
        "Enter your UPI ID in format: name@upi or name@bank",
        "You can add multiple UPI IDs",
        "UPI ID is required before going online",
      ],
    },
    {
      icon: "💰",
      title: "Step 2: Make a Deposit",
      color: "#b8860b",
      content:
        "Tap the 'Deposit' button to choose your deposit amount. Deposit Rs.500 (standard) or Rs.1000 (get Rs.400 bonus!). Scan the QR code shown, pay via UPI, then enter your UTR number and upload the payment screenshot to confirm.",
      tips: [
        "Rs.500 deposit - Start with Rs.500 balance",
        "Rs.1000 deposit - Start with Rs.1400 (40% bonus!)",
        "Always upload correct UTR and payment screenshot",
      ],
    },
    {
      icon: "🟢",
      title: "Step 3: Go Online",
      color: "#22c55e",
      content:
        "Once your UPI is added and deposit is confirmed, toggle the 'Go Online' switch on the main page. Your balance will start growing at 0.1% per second as live transactions come in through your UPI network.",
      tips: [
        "Must add UPI ID first",
        "Must have deposit balance",
        "Balance grows automatically while online",
      ],
    },
    {
      icon: "📊",
      title: "Step 4: Earn Commissions",
      color: GOLD,
      content:
        "Every transaction processed through your UPI ID earns you commission. You can track your 'Today Commission' and 'Total Commission' in the 'My UPI Transactions' table. The commission updates live every second.",
      tips: [
        "Today Commission resets daily",
        "Total Commission is your all-time earnings",
        "Live transaction feed shows all activity",
      ],
    },
    {
      icon: "💸",
      title: "Step 5: Withdraw Earnings",
      color: "#ef4444",
      content:
        "After 3 hours of being online, the withdrawal option becomes available. Your earnings will be transferred to the same UPI ID used for your deposit. Only real deposits are eligible for withdrawal.",
      tips: [
        "3-hour countdown starts when you go Online",
        "Withdrawal to same UPI used for deposit",
        "Only real deposits qualify for withdrawal",
      ],
    },
  ];

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: "#f4f6fb" }}
    >
      <div className="w-full max-w-[420px] flex flex-col pb-10">
        <StatusBar />

        {/* Promo Welcome Popup */}
        <AnimatePresence>
          {promoOpen && (
            <motion.div
              key="promo-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="mx-4 rounded-3xl overflow-hidden"
                style={{
                  background: "#ffffff",
                  border: "2px solid #D4AF37",
                  maxWidth: 340,
                  width: "100%",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
              >
                {/* Top banner */}
                <div
                  className="px-6 py-5 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #1565C0 0%, #1976d2 100%)",
                  }}
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <h2 className="text-white font-black text-xl tracking-tight">
                    Special Offer!
                  </h2>
                  <p className="text-blue-200 text-sm mt-1">
                    Limited time promotion
                  </p>
                </div>
                {/* Content */}
                <div className="px-6 py-5 text-center">
                  <div
                    className="rounded-2xl px-5 py-4 mb-4"
                    style={{
                      background: "#fffbeb",
                      border: "1.5px solid #fcd34d",
                    }}
                  >
                    <p className="text-gray-700 text-sm font-semibold mb-1">
                      Deposit ₹1000 and Earn
                    </p>
                    <p
                      className="text-4xl font-black"
                      style={{ color: "#D4AF37" }}
                    >
                      ₹400 Extra!
                    </p>
                    <p className="text-green-600 text-xs font-bold mt-2">
                      🔥 40% Bonus on ₹1000 Deposit
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-left mb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span className="text-gray-600 text-xs">
                        Deposit ₹500 – Standard earnings
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      <span className="text-gray-600 text-xs font-bold">
                        Deposit ₹1000 – Get ₹400 bonus instantly!
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-2xl py-4 font-black text-base mb-3 transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #b8860b, #D4AF37)",
                      color: "#000",
                      boxShadow: "0 4px 16px rgba(212,175,55,0.4)",
                    }}
                    onClick={() => {
                      setPromoOpen(false);
                      setSelectedDepositAmount(1000);
                      openDeposit();
                    }}
                    data-ocid="promo.primary_button"
                  >
                    Deposit Now 🚀
                  </button>
                  <button
                    type="button"
                    className="w-full text-gray-400 text-sm py-2"
                    onClick={() => setPromoOpen(false)}
                    data-ocid="promo.cancel_button"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deposit Processing Loading Overlay */}
        <AnimatePresence>
          {depositLoading && (
            <motion.div
              key="deposit-loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.75)" }}
            >
              <div
                className="flex flex-col items-center gap-6 rounded-2xl p-10"
                style={{
                  background: "#fff",
                  border: "2px solid #D4AF37",
                  minWidth: 280,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-full border-4 animate-spin"
                  style={{ borderColor: "#D4AF37", borderTopColor: "#1a56db" }}
                />
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: "#1a56db" }}>
                    Processing your deposit...
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "#7a6300" }}>
                    Adding funds in{" "}
                    <span
                      className="font-bold text-xl"
                      style={{ color: "#D4AF37" }}
                    >
                      {depositLoadingCount}
                    </span>{" "}
                    seconds...
                  </p>
                </div>
                <p className="text-xs text-center" style={{ color: "#888" }}>
                  Please wait, do not close the app
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real Deposit Notice Popup */}
        <AnimatePresence>
          {realDepositPopup && (
            <motion.div
              key="real-deposit-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="rounded-2xl p-8 mx-4"
                style={{
                  background: "#fff",
                  border: "2px solid #D4AF37",
                  maxWidth: 360,
                  width: "100%",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
                }}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: "#fff7e0",
                      border: "2px solid #D4AF37",
                    }}
                  >
                    ⚠️
                  </div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: "#1a56db" }}
                  >
                    Important Notice
                  </h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#444" }}
                  >
                    Only{" "}
                    <span
                      className="font-semibold"
                      style={{ color: "#D4AF37" }}
                    >
                      real deposits
                    </span>{" "}
                    will be eligible for withdrawal. Fake or test deposits will{" "}
                    <span className="font-semibold text-red-500">
                      not qualify
                    </span>{" "}
                    for any withdrawals.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRealDepositPopup(false)}
                    className="mt-2 w-full py-3 rounded-xl font-bold text-white text-base"
                    style={{
                      background: "linear-gradient(135deg, #1a56db, #D4AF37)",
                    }}
                    data-ocid="real_deposit_notice.confirm_button"
                  >
                    I Understand
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Logo Header */}
        <div
          style={{
            background: "#1565C0",
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 12,
            paddingRight: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Logo + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/assets/uploads/screenshot_2026-03-24_145706-019d1f2e-f1c7-7437-9a18-ac548b271eee-1.png"
              className="animate-pulse"
              alt="BP PAY Logo"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `2px solid ${GOLD}`,
                objectFit: "cover",
                boxShadow: `0 0 8px ${GOLD}44`,
                flexShrink: 0,
              }}
            />
            <div>
              <span
                style={{
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: 2,
                  lineHeight: 1,
                  display: "block",
                }}
              >
                BP•PAY
              </span>
              <span
                style={{
                  color: "#90caf9",
                  fontSize: 7,
                  letterSpacing: 3,
                  fontWeight: 600,
                }}
              >
                SECURE PAYMENTS
              </span>
            </div>
          </div>
          {/* Right: Profile button */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            data-ocid="profile.open_modal_button"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: `1.5px solid ${GOLD}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <User className="w-4 h-4 text-white" />
          </button>
        </div>

        <main className="flex flex-col gap-3 px-3 pt-3">
          {/* Go Online Card */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              {isOnline && (
                <span className="pulse-dot inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
              )}
              <div>
                <p className="text-gray-800 text-sm font-bold">Go Online</p>
                {isOnline ? (
                  <p className="text-green-600 text-[11px] font-medium">
                    LIVE • +0.1% / sec • {tpsCount} TPS
                  </p>
                ) : (
                  <p className="text-gray-400 text-[11px]">
                    Enable to earn 0.1% / sec
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={(val) => {
                if (val && entries.length === 0) {
                  toast.error("Please add a UPI ID before going online");
                  return;
                }
                setIsOnline(val);
              }}
              data-ocid="online.switch"
              className="data-[state=checked]:bg-green-500"
            />
          </motion.div>

          {/* Hero Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.05 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #0d2157 0%, #1565C0 60%, #1976D2 100%)",
              border: `1.5px solid ${GOLD}55`,
              boxShadow:
                "0 0 20px rgba(212,175,55,0.12), 0 8px 32px rgba(21,101,192,0.25)",
            }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-blue-200 text-[11px] font-semibold tracking-widest uppercase">
                      Total Current Balance
                    </span>
                    <ChevronDown className="w-3 h-3 text-blue-300" />
                  </div>
                  {statsLoading ? (
                    <div
                      className="h-9 w-32 bg-white/20 rounded animate-pulse mb-3"
                      data-ocid="balance.loading_state"
                    />
                  ) : (
                    <div
                      className="text-white text-3xl font-bold tracking-tight mb-3"
                      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                    >
                      {formatAmount(localStats.totalCurrentBalance)}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          background: `${GOLD}22`,
                          color: GOLD,
                          border: `1px solid ${GOLD}44`,
                        }}
                      >
                        🔒 Locked
                      </span>
                      <span className="text-white text-xs font-bold">
                        {formatAmount(localStats.lockedDeposit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-200 text-[11px]">
                        Today Commission:
                      </span>
                      <span className="text-white text-[11px] font-semibold">
                        {formatAmount(localStats.todayCommission)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-3">
                  <div
                    className="rounded-xl px-3 py-2 flex flex-col items-center min-w-[88px]"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <ArrowDownCircle className="w-3.5 h-3.5 text-green-300" />
                      <span className="text-blue-100 text-[10px] font-medium">
                        Transfer In
                      </span>
                    </div>
                    <span className="text-white text-sm font-bold">
                      {formatAmount(localStats.transferIn)}
                    </span>
                  </div>
                  <div
                    className="rounded-xl px-3 py-2 flex flex-col items-center min-w-[88px]"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-red-300" />
                      <span className="text-blue-100 text-[10px] font-medium">
                        Transfer Out
                      </span>
                    </div>
                    <span className="text-white text-sm font-bold">
                      {formatAmount(localStats.transferOut)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="grid grid-cols-3 gap-2.5"
          >
            {[
              {
                label: "Add UPI",
                icon: <Plus className="w-4 h-4" />,
                ocid: "upi.open_modal_button",
                action: () => setAddUpiOpen(true),
              },
              {
                label: "Deposit",
                icon: <ArrowDownCircle className="w-4 h-4" />,
                ocid: "deposit.open_modal_button",
                action: openDeposit,
              },
              {
                label: withdrawReady
                  ? "Withdraw"
                  : isOnline && withdrawalMs !== null
                    ? formatCountdown(withdrawalMs)
                    : "Withdraw",
                icon: withdrawReady ? (
                  <ArrowUpCircle className="w-4 h-4" />
                ) : isOnline && !withdrawReady ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <ArrowUpCircle className="w-4 h-4" />
                ),
                ocid: "withdraw.button",
                action: () => {
                  if (withdrawReady) {
                    toast.success("Withdrawal request submitted!");
                  } else if (
                    isOnline &&
                    withdrawalMs !== null &&
                    withdrawalMs > 0
                  ) {
                    toast.info(
                      `Withdrawal available in ${formatCountdown(withdrawalMs)}`,
                    );
                  } else {
                    toast.info("Go online to activate withdrawal timer");
                  }
                },
              },
            ].map((btn) => (
              <button
                key={btn.ocid}
                type="button"
                onClick={() => handleBtnClick(btn.ocid, btn.action)}
                data-ocid={btn.ocid}
                disabled={loadingBtn !== null}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 leading-tight disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    withdrawReady && btn.ocid === "withdraw.button"
                      ? "#f0fdf4"
                      : "#ffffff",
                  border: `1.5px solid ${
                    withdrawReady && btn.ocid === "withdraw.button"
                      ? "#22c55e"
                      : GOLD
                  }88`,
                  color:
                    withdrawReady && btn.ocid === "withdraw.button"
                      ? "#16a34a"
                      : "#1565C0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                }}
              >
                {loadingBtn === btn.ocid ? <SpinnerIcon /> : btn.icon}
                <span className="text-center px-0.5">
                  {loadingBtn === btn.ocid ? "Loading..." : btn.label}
                </span>
              </button>
            ))}
          </motion.div>

          {/* UPI Entries Table */}
          {entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
              className="rounded-2xl overflow-hidden"
              style={goldenCard}
            >
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ color: "#1565C0" }}>
                  My UPI IDs
                </h2>
                <span className="text-gray-400 text-[11px]">
                  {entries.length} entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table data-ocid="upi.table">
                  <TableHeader>
                    <TableRow
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                      className="hover:bg-transparent"
                    >
                      {[
                        "UPI ID",
                        "Status",
                        "Today Comm.",
                        "Total Comm.",
                        "",
                      ].map((h) => (
                        <TableHead
                          key={h}
                          className="text-[11px] font-semibold px-3 py-2 text-gray-500"
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, idx) => (
                      <TableRow
                        key={entry.upiId}
                        className="hover:bg-gray-50"
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                        data-ocid={`upi.item.${idx + 1}`}
                      >
                        <TableCell className="px-3 py-2.5 text-xs font-medium text-gray-800 max-w-[100px] truncate">
                          {entry.upiId}
                        </TableCell>
                        <TableCell className="px-2 py-2.5">
                          <Badge
                            className="text-[10px] px-2 py-0.5 font-bold border-0"
                            style={{ background: "#dcfce7", color: "#16a34a" }}
                          >
                            ACTIVE
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="px-2 py-2.5 text-xs font-semibold"
                          style={{ color: GOLD }}
                        >
                          {formatAmount(entry.todayCommission)}
                        </TableCell>
                        <TableCell className="px-2 py-2.5 text-xs text-blue-600">
                          {formatAmount(entry.totalCommission)}
                        </TableCell>
                        <TableCell className="px-2 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.upiId)}
                            className="text-red-300 hover:text-red-500 transition-colors"
                            data-ocid={`upi.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}

          {/* Live UPI Transactions - bigger rows */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="rounded-2xl overflow-hidden"
            style={goldenCard}
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold" style={{ color: "#1565C0" }}>
                My UPI Transactions
              </h2>
              <div className="flex items-center gap-2">
                {isOnline && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
                <span className="text-gray-400 text-[11px]">
                  {liveTransactions.length} tx
                </span>
              </div>
            </div>

            <div className="overflow-x-auto" style={{ minHeight: "450px" }}>
              <Table>
                <TableHeader>
                  <TableRow
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                    className="hover:bg-transparent"
                  >
                    {["Time", "Server", "UPI ID", "Amount", "Type"].map((h) => (
                      <TableHead
                        key={h}
                        className="text-xs font-semibold px-3 py-2.5 text-gray-500"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10"
                        data-ocid="upi.empty_state"
                      >
                        <p className="text-gray-400 text-sm">
                          Go online to see live transactions
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    liveTransactions.map((tx) => (
                      <TableRow
                        key={tx.id}
                        className="hover:bg-gray-50"
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <TableCell className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {tx.timeLabel}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span
                            className="text-xs font-bold px-2 py-1 rounded"
                            style={{
                              background: "#e3f2fd",
                              color: "#1565C0",
                              border: "1px solid #bbdefb",
                            }}
                          >
                            {tx.server}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-gray-700 max-w-[90px] truncate">
                          {tx.upiId}
                        </TableCell>
                        <TableCell
                          className="px-3 py-3 text-sm font-bold"
                          style={{
                            color: tx.type === "CREDIT" ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}
                          {formatAmount(tx.amount)}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge
                            className="text-xs px-2 py-0.5 font-bold border-0"
                            style={{
                              background:
                                tx.type === "CREDIT" ? "#dcfce7" : "#fee2e2",
                              color:
                                tx.type === "CREDIT" ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {tx.type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {entries.length === 0 && (
            <div className="text-center py-2">
              <p className="text-gray-400 text-xs">
                Tap "Add UPI" to add your UPI ID
              </p>
            </div>
          )}
        </main>

        <footer className="mt-8 text-center text-[10px] text-gray-400 px-4">
          © {new Date().getFullYear()}. Built with{" "}
          <span style={{ color: "#e57373" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: GOLD }}
            className="underline underline-offset-2"
          >
            caffeine.ai
          </a>
        </footer>
      </div>

      {/* Add UPI Dialog */}
      <Dialog open={addUpiOpen} onOpenChange={setAddUpiOpen}>
        <DialogContent
          className="max-w-[340px] rounded-2xl"
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
          data-ocid="upi.dialog"
        >
          <DialogHeader>
            <DialogTitle
              className="text-base font-bold"
              style={{ color: "#1565C0" }}
            >
              Add UPI ID
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="upi-id"
                className="text-xs font-semibold text-gray-600"
              >
                UPI ID
              </Label>
              <Input
                id="upi-id"
                placeholder="e.g. name@upi"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value)}
                className="rounded-xl text-sm text-gray-800"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                data-ocid="upi.input"
                onKeyDown={(e) => e.key === "Enter" && handleAddUpi()}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl text-gray-600"
              style={{ background: "transparent", border: "1px solid #e2e8f0" }}
              onClick={() => setAddUpiOpen(false)}
              data-ocid="upi.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl font-bold"
              style={{ background: GOLD, color: "#000" }}
              onClick={handleAddUpi}
              data-ocid="upi.submit_button"
            >
              Add UPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={closeDeposit}>
        <DialogContent
          className="max-w-[360px] rounded-2xl"
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
          data-ocid="deposit.dialog"
        >
          <DialogHeader>
            <DialogTitle
              className="text-base font-bold"
              style={{ color: "#1565C0" }}
            >
              {depositStep === 1 && "Deposit"}
              {depositStep === 2 && "Make Payment"}
              {depositStep === 3 && "Confirm Payment"}
            </DialogTitle>
            <div className="flex items-center gap-1 pt-1">
              {([1, 2, 3] as DepositStep[]).map((s) => (
                <div
                  key={s}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{ background: depositStep >= s ? GOLD : "#e2e8f0" }}
                />
              ))}
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {depositStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <div className="w-full">
                  <p className="text-blue-500 text-xs mb-3 tracking-wide uppercase font-semibold text-center">
                    Select Deposit Amount
                  </p>
                  <div className="flex gap-3 w-full">
                    {([500, 1000] as (500 | 1000)[]).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSelectedDepositAmount(amt)}
                        className="flex-1 rounded-2xl py-5 text-center cursor-pointer transition-all"
                        style={{
                          background:
                            selectedDepositAmount === amt
                              ? "#1565C0"
                              : "#f0f6ff",
                          border:
                            selectedDepositAmount === amt
                              ? "2px solid #1565C0"
                              : "1px solid #bfdbfe",
                          boxShadow:
                            selectedDepositAmount === amt
                              ? "0 4px 16px rgba(21,101,192,0.3)"
                              : "none",
                        }}
                      >
                        <p
                          className="text-3xl font-black"
                          style={{
                            color:
                              selectedDepositAmount === amt ? "#ffffff" : GOLD,
                          }}
                        >
                          ₹{amt}
                        </p>
                        {amt === 1000 && (
                          <p
                            className="text-xs mt-1 font-bold"
                            style={{
                              color:
                                selectedDepositAmount === amt
                                  ? "#90caf9"
                                  : "#22c55e",
                            }}
                          >
                            +₹400 BONUS
                          </p>
                        )}
                        {amt === 500 && (
                          <p
                            className="text-xs mt-1"
                            style={{
                              color:
                                selectedDepositAmount === amt
                                  ? "#90caf9"
                                  : "#6b7280",
                            }}
                          >
                            Standard
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="rounded-xl px-4 py-3 w-full"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <p className="text-gray-500 text-xs">
                    • Amount will be added to your Locked Balance
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    • Earn 0.1% per second when online
                  </p>
                </div>
                <Button
                  className="w-full rounded-xl font-bold text-base py-5"
                  style={{
                    background: "linear-gradient(135deg, #b8860b, #D4AF37)",
                    color: "#000",
                  }}
                  onClick={() => setDepositStep(2)}
                  data-ocid="deposit.primary_button"
                >
                  Proceed →
                </Button>
              </motion.div>
            )}

            {depositStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-4 py-2"
              >
                <div
                  className="rounded-2xl p-3"
                  style={{ border: `2px solid ${GOLD}55`, background: "#fff" }}
                >
                  <img
                    src="/assets/uploads/photo_6201944831857200842_x-019d2093-bb00-70eb-bd05-715d744dc0e8-1.jpg"
                    alt="UPI QR Code"
                    className="w-56 h-56 object-contain"
                  />
                </div>

                <div className="w-full flex items-center justify-between px-1">
                  <span className="text-gray-600 text-sm">Amount to Pay</span>
                  <span className="font-black text-lg" style={{ color: GOLD }}>
                    ₹{selectedDepositAmount}
                  </span>
                </div>
                <Button
                  className="w-full rounded-xl font-bold py-5"
                  style={{
                    background: "linear-gradient(135deg, #b8860b, #D4AF37)",
                    color: "#000",
                  }}
                  onClick={() => setDepositStep(3)}
                  data-ocid="deposit.confirm_button"
                >
                  I have paid →
                </Button>
              </motion.div>
            )}

            {depositStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 py-2"
              >
                {/* Warning box */}
                <div
                  className="rounded-xl px-4 py-3 flex flex-col gap-1"
                  style={{
                    background: "#fffbeb",
                    border: "1.5px solid #fcd34d",
                  }}
                >
                  <p className="text-amber-800 text-xs font-bold">
                    ⚠️ Important:
                  </p>
                  <p className="text-amber-700 text-[11px]">
                    • Upload correct UTR number and Payment Screenshot
                  </p>
                  <p className="text-amber-700 text-[11px]">
                    • Withdrawal will be made on the same UPI ID used for
                    payment
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-gray-600">
                    UTR Number
                  </Label>
                  <Input
                    placeholder="Enter 12-digit UTR number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="rounded-xl text-sm text-gray-800"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                    maxLength={20}
                    data-ocid="deposit.input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-gray-600">
                    Payment Screenshot
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleScreenshotSelect}
                  />
                  {screenshotPreview ? (
                    <div
                      className="relative rounded-xl overflow-hidden"
                      style={{ border: "1px solid #e2e8f0" }}
                    >
                      <img
                        src={screenshotPreview}
                        alt="Payment screenshot"
                        className="w-full max-h-36 object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-black/40 rounded-full p-1 text-white text-xs"
                        onClick={() => {
                          setScreenshotFile(null);
                          setScreenshotPreview(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-xl py-6 flex flex-col items-center gap-2 transition-all"
                      style={{
                        background: "#f8fafc",
                        border: `1.5px dashed ${GOLD}66`,
                        color: "#1565C0",
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      data-ocid="deposit.upload_button"
                    >
                      <ArrowDownCircle className="w-6 h-6" />
                      <span className="text-xs font-semibold">
                        Upload Payment Screenshot
                      </span>
                    </button>
                  )}
                </div>
                <Button
                  className="w-full rounded-xl font-bold py-5"
                  style={{
                    background: "linear-gradient(135deg, #b8860b, #D4AF37)",
                    color: "#000",
                  }}
                  onClick={handleConfirmDeposit}
                  data-ocid="deposit.submit_button"
                >
                  Confirm Deposit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Profile Panel */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            key="profile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setProfileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-[85vw] max-w-[340px] flex flex-col overflow-y-auto"
              style={{ background: "#ffffff" }}
              onClick={(e) => e.stopPropagation()}
              data-ocid="profile.panel"
            >
              <div
                className="px-5 pt-10 pb-6 flex flex-col items-center text-center relative"
                style={{
                  background: "linear-gradient(135deg, #0d2157, #1565C0)",
                }}
              >
                <div
                  className="rounded-full mb-3 flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    background: "rgba(212,175,55,0.2)",
                    border: "2px solid #D4AF37",
                  }}
                >
                  <User className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-bold text-lg">
                  {localStorage.getItem("bppay_current_user") || "Guest"}
                </p>
                <p style={{ color: "#90caf9", fontSize: 11 }}>
                  BP&bull;PAY Member
                </p>
                <button
                  type="button"
                  className="absolute top-4 right-4"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  onClick={() => setProfileOpen(false)}
                  data-ocid="profile.close_button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-4 flex flex-col gap-3">
                <div
                  className="rounded-2xl p-4 flex items-center gap-3"
                  style={{
                    background: "#f0f6ff",
                    border: "1.5px solid #bfdbfe",
                  }}
                >
                  <Wallet className="w-5 h-5" style={{ color: "#1565C0" }} />
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">
                      Total Balance
                    </p>
                    <p className="text-gray-800 font-black text-lg">
                      {formatAmount(localStats.totalCurrentBalance)}
                    </p>
                  </div>
                </div>
                <div
                  className="rounded-2xl p-4 flex items-center gap-3"
                  style={{
                    background: "#fffbeb",
                    border: "1.5px solid rgba(212,175,55,0.4)",
                  }}
                >
                  <Check className="w-5 h-5" style={{ color: GOLD }} />
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">
                      Total Commission
                    </p>
                    <p className="text-gray-800 font-black text-lg">
                      {formatAmount(localStats.todayCommission)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2 px-1">
                    My UPI IDs
                  </p>
                  {entries.length === 0 ? (
                    <div
                      className="rounded-2xl p-4 text-center text-gray-400 text-xs"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                      data-ocid="profile.empty_state"
                    >
                      No UPI IDs added yet
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {entries.map((e, i) => (
                        <div
                          key={e.upiId}
                          className="rounded-xl px-3 py-2 flex items-center gap-2"
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                          }}
                          data-ocid={`profile.item.${i + 1}`}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: "#22c55e" }}
                          />
                          <span className="text-gray-700 text-xs font-semibold flex-1 truncate">
                            {e.upiId}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="w-full rounded-xl py-3 font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #b8860b, #D4AF37)",
                    color: "#000",
                  }}
                  onClick={() => {
                    setProfileOpen(false);
                    openDeposit();
                  }}
                  data-ocid="profile.deposit_button"
                >
                  Make Deposit
                </button>

                <button
                  type="button"
                  className="w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #1565C0, #1976D2)",
                    color: "#fff",
                    boxShadow: "0 2px 10px rgba(21,101,192,0.3)",
                  }}
                  onClick={() => {
                    setProfileOpen(false);
                    setChatOpen(true);
                  }}
                  data-ocid="profile.chat_button"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Support
                </button>

                <button
                  type="button"
                  className="w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #b8860b, #D4AF37)",
                    color: "#000",
                  }}
                  onClick={() => {
                    setProfileOpen(false);
                    setTutorialOpen(true);
                  }}
                  data-ocid="profile.tutorial_button"
                >
                  <BookOpen className="w-4 h-4" />
                  App Tutorial
                </button>

                <button
                  type="button"
                  className="w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: "#fff5f5",
                    border: "1px solid #fecaca",
                    color: "#ef4444",
                  }}
                  onClick={() => {
                    localStorage.removeItem("bppay_current_user");
                    if (onLogout) onLogout();
                  }}
                  data-ocid="profile.logout_button"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ChatBot floating button */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        data-ocid="chat.open_modal_button"
        className="fixed z-40 flex items-center justify-center rounded-full transition-all active:scale-95"
        style={{
          bottom: 84,
          left: 20,
          width: 52,
          height: 52,
          background: "linear-gradient(135deg, #1565C0, #1976D2)",
          border: "2px solid rgba(212,175,55,0.4)",
          boxShadow: "0 4px 20px rgba(21,101,192,0.45)",
        }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Tutorial floating button */}
      <button
        type="button"
        onClick={() => setTutorialOpen(true)}
        data-ocid="tutorial.open_modal_button"
        className="fixed z-40 flex items-center justify-center rounded-full transition-all active:scale-95"
        style={{
          bottom: 84,
          right: 20,
          width: 52,
          height: 52,
          background: "linear-gradient(135deg, #b8860b, #D4AF37)",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 4px 20px rgba(212,175,55,0.55)",
        }}
      >
        <BookOpen className="w-6 h-6 text-black" />
      </button>

      {/* ChatBot Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setChatOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-[420px] rounded-t-3xl overflow-hidden flex flex-col"
              style={{ background: "#ffffff", maxHeight: "75vh" }}
              onClick={(e) => e.stopPropagation()}
              data-ocid="chat.panel"
            >
              <div
                className="px-5 py-4 flex items-center justify-between flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #0d2157, #1565C0)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      background: "rgba(255,255,255,0.15)",
                    }}
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      BP&bull;PAY Support
                    </p>
                    <p style={{ color: "#90caf9", fontSize: 10 }}>
                      3 Hour TAT &bull; Always Online
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  data-ocid="chat.close_button"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="rounded-2xl px-4 py-2.5 max-w-[80%] text-xs leading-relaxed"
                      style={
                        msg.from === "user"
                          ? { background: "#1565C0", color: "#fff" }
                          : {
                              background: "#f1f5f9",
                              color: "#374151",
                              border: "1px solid #e2e8f0",
                            }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
                style={{ borderTop: "1px solid #e2e8f0" }}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-full px-4 py-2 text-xs outline-none"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  data-ocid="chat.input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      sendChatMessage(chatInput.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  data-ocid="chat.submit_button"
                  className="rounded-full p-2 flex items-center justify-center active:scale-95"
                  style={{ background: "#1565C0" }}
                  onClick={() => {
                    if (chatInput.trim()) sendChatMessage(chatInput.trim());
                  }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {tutorialOpen && (
          <motion.div
            key="tutorial-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setTutorialOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-[420px] rounded-t-3xl overflow-hidden"
              style={{ background: "#ffffff", maxHeight: "82vh" }}
              onClick={(e) => e.stopPropagation()}
              data-ocid="tutorial.panel"
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg, #b8860b, #D4AF37)",
                }}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-black" />
                  <div>
                    <p className="text-black font-black text-sm">
                      BP&bull;PAY Tutorial
                    </p>
                    <p style={{ color: "#5c4000", fontSize: 10 }}>
                      Learn how to use the app
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTutorialOpen(false)}
                  data-ocid="tutorial.close_button"
                  style={{ color: "rgba(0,0,0,0.5)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-gray-100 overflow-x-auto">
                {[
                  "Add UPI",
                  "Deposit",
                  "Go Online",
                  "Commissions",
                  "Withdraw",
                ].map((step, i) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setTutorialStep(i)}
                    className="flex-shrink-0 px-3 py-2.5 text-xs font-bold transition-all"
                    style={{
                      borderBottom:
                        tutorialStep === i
                          ? "2px solid #D4AF37"
                          : "2px solid transparent",
                      color: tutorialStep === i ? "#b8860b" : "#9ca3af",
                      background: "transparent",
                    }}
                    data-ocid="tutorial.tab"
                  >
                    {i + 1}. {step}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
                <AnimatePresence mode="wait">
                  {tutorialSteps[tutorialStep] && (
                    <motion.div
                      key={tutorialStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 py-5"
                    >
                      <div className="text-5xl mb-4 text-center">
                        {tutorialSteps[tutorialStep].icon}
                      </div>
                      <h3
                        className="text-base font-black mb-3 text-center"
                        style={{ color: tutorialSteps[tutorialStep].color }}
                      >
                        {tutorialSteps[tutorialStep].title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {tutorialSteps[tutorialStep].content}
                      </p>
                      <div
                        className="rounded-2xl p-4 flex flex-col gap-2"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">
                          Key Points
                        </p>
                        {tutorialSteps[tutorialStep].tips.map((tip) => (
                          <div key={tip} className="flex items-start gap-2">
                            <span
                              style={{
                                color: GOLD,
                                fontWeight: 900,
                                flexShrink: 0,
                              }}
                            >
                              &#10003;
                            </span>
                            <span className="text-gray-600 text-xs">{tip}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-5">
                        {tutorialStep > 0 && (
                          <button
                            type="button"
                            onClick={() => setTutorialStep(tutorialStep - 1)}
                            className="flex-1 rounded-xl py-2.5 text-xs font-bold"
                            style={{
                              border: "1px solid #e2e8f0",
                              color: "#6b7280",
                            }}
                          >
                            &larr; Previous
                          </button>
                        )}
                        {tutorialStep < tutorialSteps.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setTutorialStep(tutorialStep + 1)}
                            className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white"
                            style={{
                              background: tutorialSteps[tutorialStep].color,
                            }}
                          >
                            Next &rarr;
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setTutorialOpen(false)}
                            className="flex-1 rounded-xl py-2.5 text-xs font-bold text-black"
                            style={{
                              background:
                                "linear-gradient(135deg, #b8860b, #D4AF37)",
                            }}
                          >
                            Get Started!
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  Check,
  ChevronDown,
  Clock,
  Copy,
  Plus,
  Trash2,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useDashboardStats,
  useUpdateDashboardStats,
} from "../hooks/useQueries";

const GOLD = "#D4AF37";
const DEPOSIT_AMOUNT = 500;
const SERVERS = ["1xbet", "Stake", "BDGGame"];
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "bppay_upi_entries";

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

function loadEntries(): UpiEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UpiEntry[];
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: UpiEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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

export default function Dashboard() {
  const [entries, setEntries] = useState<UpiEntry[]>(loadEntries);
  const [addUpiOpen, setAddUpiOpen] = useState(false);
  const [newUpiId, setNewUpiId] = useState("");

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<DepositStep>(1);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const [isOnline, setIsOnline] = useState(false);
  const [tpsCount, setTpsCount] = useState(0);
  const [liveTransactions, setLiveTransactions] = useState<LiveTx[]>([]);
  const [withdrawalMs, setWithdrawalMs] = useState<number | null>(null);
  const withdrawReady = withdrawalMs !== null && withdrawalMs <= 0;

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const [localStats, setLocalStats] = useState({
    totalCurrentBalance: 0,
    lockedDeposit: 0,
    todayCommission: 0,
    transferIn: 0,
    transferOut: 0,
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
  const fiftyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const withdrawTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pending50Ref = useRef(false);

  const stopOnline = useCallback(() => {
    if (onlineTimerRef.current) clearInterval(onlineTimerRef.current);
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    if (fiftyTimerRef.current) clearInterval(fiftyTimerRef.current);
    if (withdrawTimerRef.current) clearInterval(withdrawTimerRef.current);
    onlineTimerRef.current = null;
    syncTimerRef.current = null;
    fiftyTimerRef.current = null;
    withdrawTimerRef.current = null;
    pending50Ref.current = false;
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
    setWithdrawalMs(SIX_HOURS_MS);

    onlineTimerRef.current = setInterval(() => {
      setLocalStats((prev) => {
        const increase = prev.lockedDeposit * 0.00013;
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

        return {
          ...prev,
          lockedDeposit: prev.lockedDeposit + increase,
          totalCurrentBalance: prev.totalCurrentBalance + increase,
        };
      });
    }, 1000);

    fiftyTimerRef.current = setInterval(() => {
      if (pending50Ref.current) return;
      pending50Ref.current = true;
      const server = randomServer();
      const upi = getUpiId();
      const tl = nowLabel();
      const id = Date.now().toString();

      setLiveTransactions((txs) =>
        [
          {
            id: `${id}d50`,
            server,
            upiId: upi,
            amount: 50,
            type: "DEBIT" as const,
            timeLabel: tl,
          },
          ...txs,
        ].slice(0, 60),
      );
      setLocalStats((prev) => ({
        ...prev,
        lockedDeposit: Math.max(0, prev.lockedDeposit - 50),
        totalCurrentBalance: Math.max(0, prev.totalCurrentBalance - 50),
      }));

      setTimeout(() => {
        const tl2 = nowLabel();
        const id2 = Date.now().toString();
        setLiveTransactions((txs) =>
          [
            {
              id: `${id2}c50`,
              server,
              upiId: upi,
              amount: 50,
              type: "CREDIT" as const,
              timeLabel: tl2,
            },
            ...txs,
          ].slice(0, 60),
        );
        setLocalStats((prev) => ({
          ...prev,
          lockedDeposit: prev.lockedDeposit + 50,
          totalCurrentBalance: prev.totalCurrentBalance + 50,
        }));
        pending50Ref.current = false;
      }, 1500);
    }, 18000);

    withdrawTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTs;
      const remaining = SIX_HOURS_MS - elapsed;
      setWithdrawalMs(remaining);
    }, 1000);

    syncTimerRef.current = setInterval(() => {
      setLocalStats((prev) => {
        updateMutateRef.current(prev);
        return prev;
      });
    }, 10000);

    return stopOnline;
  }, [isOnline, stopOnline, getUpiId]);

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
    saveEntries(updated);
    toast.success("UPI ID added successfully");
    setAddUpiOpen(false);
    setNewUpiId("");
  };

  const handleDelete = (upiId: string) => {
    const updated = entries.filter((e) => e.upiId !== upiId);
    setEntries(updated);
    saveEntries(updated);
    toast.success("UPI ID removed");
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("bppay@upi");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    setLocalStats((prev) => ({
      ...prev,
      lockedDeposit: prev.lockedDeposit + DEPOSIT_AMOUNT,
      totalCurrentBalance: prev.totalCurrentBalance + DEPOSIT_AMOUNT,
    }));
    toast.success(
      `\u20b9${DEPOSIT_AMOUNT} deposited! Funds added to Locked Balance.`,
    );
    setDepositOpen(false);
    setDepositStep(1);
    setUtrNumber("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  const openDeposit = () => {
    setDepositStep(1);
    setUtrNumber("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setDepositOpen(true);
  };

  const closeDeposit = () => {
    setDepositOpen(false);
    setTimeout(() => setDepositStep(1), 300);
  };

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: "#f4f6fb" }}
    >
      <div className="w-full max-w-[420px] flex flex-col pb-10">
        <StatusBar />

        {/* Double-border Header */}
        <div
          style={{
            padding: 3,
            background: "#1565C0",
            borderTop: "3px solid #1565C0",
            borderBottom: "3px solid #1565C0",
          }}
        >
          <div
            style={{
              border: "2px solid #90caf9",
              borderRadius: 6,
              background: "#ffffff",
              paddingTop: 10,
              paddingBottom: 10,
              textAlign: "center",
            }}
          >
            <span
              style={{
                color: GOLD,
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: 3,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                textShadow: "0 1px 4px rgba(180,140,0,0.18)",
              }}
            >
              BP•PAY
            </span>
            <div
              style={{
                color: "#1565C0",
                fontSize: 9,
                letterSpacing: 4,
                marginTop: 1,
                fontWeight: 600,
              }}
            >
              SECURE PAYMENT GATEWAY
            </div>
          </div>
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
                    LIVE • +0.013% / sec • {tpsCount} TPS
                  </p>
                ) : (
                  <p className="text-gray-400 text-[11px]">
                    Enable to earn 0.013% / sec
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={setIsOnline}
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
                onClick: () => setAddUpiOpen(true),
              },
              {
                label: "Deposit",
                icon: <ArrowDownCircle className="w-4 h-4" />,
                ocid: "deposit.open_modal_button",
                onClick: openDeposit,
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
                onClick: () => {
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
                onClick={btn.onClick}
                data-ocid={btn.ocid}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 leading-tight"
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
                {btn.icon}
                <span className="text-center px-0.5">{btn.label}</span>
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
                            style={{
                              background: "#dcfce7",
                              color: "#16a34a",
                            }}
                          >
                            ACTIVE
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 text-xs text-blue-600">
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

          {/* Live UPI Transactions */}
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                    className="hover:bg-transparent"
                  >
                    {["Time", "Server", "UPI ID", "Amount", "Type"].map((h) => (
                      <TableHead
                        key={h}
                        className="text-[10px] font-semibold px-2 py-2 text-gray-500"
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
                        className="text-center py-8"
                        data-ocid="upi.empty_state"
                      >
                        <p className="text-gray-400 text-xs">
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
                        <TableCell className="px-2 py-1.5 text-[10px] text-gray-500 whitespace-nowrap">
                          {tx.timeLabel}
                        </TableCell>
                        <TableCell className="px-2 py-1.5">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: "#e3f2fd",
                              color: "#1565C0",
                              border: "1px solid #bbdefb",
                            }}
                          >
                            {tx.server}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-[10px] text-gray-700 max-w-[80px] truncate">
                          {tx.upiId}
                        </TableCell>
                        <TableCell
                          className="px-2 py-1.5 text-[10px] font-bold"
                          style={{
                            color: tx.type === "CREDIT" ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}
                          {formatAmount(tx.amount)}
                        </TableCell>
                        <TableCell className="px-2 py-1.5">
                          <Badge
                            className="text-[9px] px-1.5 py-0 font-bold border-0"
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
              style={{
                background: "transparent",
                border: "1px solid #e2e8f0",
              }}
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
                <div
                  className="rounded-2xl px-10 py-6 text-center"
                  style={{
                    background: "#f0f6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <p className="text-blue-500 text-xs mb-2 tracking-wide uppercase font-semibold">
                    Fixed Deposit Amount
                  </p>
                  <p
                    className="text-4xl font-black"
                    style={{
                      color: GOLD,
                      textShadow: "0 1px 8px rgba(180,140,0,0.15)",
                    }}
                  >
                    ₹{DEPOSIT_AMOUNT}.00
                  </p>
                  <p className="text-blue-400 text-xs mt-2">
                    One-time locked deposit
                  </p>
                </div>
                <div
                  className="rounded-xl px-4 py-3 w-full"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <p className="text-gray-500 text-xs">
                    • Amount will be added to your Locked Balance
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    • Earn 0.013% per second when online
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
                    src="/assets/generated/upi-qr-code-transparent.dim_300x300.png"
                    alt="UPI QR Code"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer active:opacity-80"
                  style={{
                    background: "#f0f6ff",
                    border: "1px solid #bfdbfe",
                  }}
                  onClick={handleCopyUpi}
                  onKeyDown={(e) => e.key === "Enter" && handleCopyUpi()}
                  data-ocid="deposit.secondary_button"
                >
                  <div>
                    <p className="text-blue-400 text-[10px] uppercase tracking-wide font-semibold">
                      UPI ID
                    </p>
                    <p className="text-gray-800 font-bold text-sm">bppay@upi</p>
                  </div>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" style={{ color: GOLD }} />
                  )}
                </button>
                <div className="w-full flex items-center justify-between px-1">
                  <span className="text-gray-600 text-sm">Amount to Pay</span>
                  <span className="font-black text-lg" style={{ color: GOLD }}>
                    ₹{DEPOSIT_AMOUNT}
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
    </div>
  );
}

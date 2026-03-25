import { useEffect, useState } from "react";

const PROCESSING_ITEMS = [
  {
    id: 1,
    type: "Withdrawal",
    upi: "user****@upi",
    amount: "₹2,400",
    status: "completed",
  },
  {
    id: 2,
    type: "Refund",
    upi: "pay****@okaxis",
    amount: "₹850",
    status: "completed",
  },
  {
    id: 3,
    type: "Transaction",
    upi: "user****@paytm",
    amount: "₹1,200",
    status: "completed",
  },
  {
    id: 4,
    type: "Withdrawal",
    upi: "acct****@ybl",
    amount: "₹3,500",
    status: "processing",
  },
  {
    id: 5,
    type: "Refund",
    upi: "pay****@freecharge",
    amount: "₹600",
    status: "processing",
  },
  {
    id: 6,
    type: "Transaction",
    upi: "user****@okicici",
    amount: "₹1,800",
    status: "pending",
  },
  {
    id: 7,
    type: "Withdrawal",
    upi: "acct****@upi",
    amount: "₹2,000",
    status: "pending",
  },
  {
    id: 8,
    type: "Refund",
    upi: "pay****@okhdfcbank",
    amount: "₹450",
    status: "pending",
  },
];

export default function AppLoadingScreen({ onDone }: { onDone: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [completedIds, setCompletedIds] = useState<number[]>([1, 2, 3]);
  const [progress, setProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    // Show skip button after 4 seconds
    const skipTimer = setTimeout(() => setShowSkip(true), 4000);

    // Reveal items one by one
    const itemTimers: ReturnType<typeof setTimeout>[] = [];
    PROCESSING_ITEMS.forEach((_, i) => {
      itemTimers.push(setTimeout(() => setVisibleCount(i + 1), i * 400 + 300));
    });

    // Progress bar
    const progInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progInterval);
          return 100;
        }
        return p + 1;
      });
    }, 120);

    // Animate items to completed
    const completeTimers = [4, 5, 6, 7, 8].map((id, i) =>
      setTimeout(
        () => setCompletedIds((prev) => [...prev, id]),
        3000 + i * 600,
      ),
    );

    // Auto close after 15 seconds
    const doneTimer = setTimeout(onDone, 15000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(doneTimer);
      itemTimers.forEach(clearTimeout);
      completeTimers.forEach(clearTimeout);
      clearInterval(progInterval);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(160deg, #0a1a3a 0%, #0d2356 50%, #0a1a3a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        zIndex: 9999,
        overflowY: "auto",
        fontFamily: "'Segoe UI', sans-serif",
        paddingBottom: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
          padding: "18px 20px 14px",
          textAlign: "center",
        }}
      >
        <img
          src="/assets/uploads/screenshot_2026-03-24_145706-019d20a0-0a10-735d-84aa-d91f4eba9453-1.png"
          alt="BP PAY"
          style={{
            height: 52,
            marginBottom: 6,
            filter: "drop-shadow(0 0 10px rgba(255,215,0,0.5))",
          }}
        />
        <div
          style={{
            color: "#ffd700",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 2,
          }}
        >
          BP•PAY SYSTEM
        </div>
      </div>

      {/* Main message */}
      <div
        style={{
          padding: "22px 20px 10px",
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,215,0,0.1)",
            border: "1px solid rgba(255,215,0,0.3)",
            borderRadius: 30,
            padding: "7px 18px",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 8px #4ade80",
              display: "inline-block",
              animation: "pulse 1.2s infinite",
            }}
          />
          <span
            style={{
              color: "#ffd700",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            PROCESSING ALL ORDERS
          </span>
        </div>

        <h2
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            margin: "0 0 10px",
            lineHeight: 1.4,
          }}
        >
          All Withdrawals, Refunds &amp; Transactions Are Being Completed
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            lineHeight: 1.7,
            margin: "0 0 6px",
          }}
        >
          Please wait — all existing and remaining orders will be completed
          shortly.
        </p>
        <p
          style={{
            color: "rgba(255,215,0,0.85)",
            fontSize: 12,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Thank you for your patience and cooperation.
        </p>
      </div>

      {/* Notice box */}
      <div
        style={{
          margin: "10px 16px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,215,0,0.25)",
          borderLeft: "3px solid #ffd700",
          borderRadius: 10,
          padding: "12px 16px",
          maxWidth: 420,
          width: "calc(100% - 32px)",
        }}
      >
        <div
          style={{
            color: "#ffd700",
            fontWeight: 700,
            fontSize: 12,
            marginBottom: 5,
            letterSpacing: 0.5,
          }}
        >
          ℹ️ IMPORTANT NOTICE
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 12,
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          We work with{" "}
          <strong style={{ color: "#ffd700" }}>
            betting &amp; gaming sites
          </strong>
          . As per their payout guidelines and compliance rules, all withdrawals
          are processed in scheduled batches. Your funds are safe and will be
          credited to your registered UPI ID.
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "calc(100% - 32px)",
          maxWidth: 420,
          margin: "0 16px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
            Processing...
          </span>
          <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #1d4ed8, #ffd700)",
              borderRadius: 10,
              transition: "width 0.3s",
              boxShadow: "0 0 8px rgba(255,215,0,0.4)",
            }}
          />
        </div>
      </div>

      {/* Orders list */}
      <div
        style={{ width: "calc(100% - 32px)", maxWidth: 420, margin: "0 16px" }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          Order Queue
        </div>
        {PROCESSING_ITEMS.slice(0, visibleCount).map((item) => {
          const isCompleted = completedIds.includes(item.id);
          const isProcessing = !isCompleted && item.status === "processing";
          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${isCompleted ? "rgba(74,222,128,0.25)" : isProcessing ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 8,
                animation: "fadeIn 0.4s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: isCompleted
                      ? "rgba(74,222,128,0.15)"
                      : isProcessing
                        ? "rgba(255,215,0,0.1)"
                        : "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {item.type === "Withdrawal"
                    ? "💸"
                    : item.type === "Refund"
                      ? "↩️"
                      : "💳"}
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                    {item.type}
                  </div>
                  <div
                    style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  >
                    {item.upi}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    color: isCompleted ? "#4ade80" : "#ffd700",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {item.amount}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    justifyContent: "flex-end",
                    marginTop: 2,
                  }}
                >
                  {isCompleted ? (
                    <>
                      <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>
                      <span
                        style={{
                          color: "#4ade80",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        Completed
                      </span>
                    </>
                  ) : isProcessing ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#ffd700",
                          animation: "pulse 0.8s infinite",
                        }}
                      />
                      <span style={{ color: "#ffd700", fontSize: 10 }}>
                        Processing
                      </span>
                    </>
                  ) : (
                    <span
                      style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}
                    >
                      Queued
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 20, padding: "0 20px" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
          Secured by BP•PAY · All transactions are encrypted
        </p>
      </div>

      {/* Skip button */}
      {showSkip && (
        <button
          type="button"
          onClick={onDone}
          style={{
            marginTop: 16,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 20,
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            padding: "7px 22px",
            cursor: "pointer",
          }}
        >
          Skip →
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

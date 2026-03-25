import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const GOLD = "#D4AF37";
const USERS_KEY = "bppay_users";
const CURRENT_USER_KEY = "bppay_current_user";

type StoredUser = { username: string; passwordHash: string };

function hashPassword(password: string): string {
  return btoa(encodeURIComponent(password));
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {
    // ignore
  }
  return [];
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleLogin = () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // Admin hardcoded bypass
      if (username.trim() === "admin" && password === "admin") {
        localStorage.setItem(CURRENT_USER_KEY, "admin");
        setLoading(false);
        onLogin();
        return;
      }
      const users = loadUsers();
      const hash = hashPassword(password);
      const user = users.find(
        (u) => u.username === username.trim() && u.passwordHash === hash,
      );
      if (!user) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }
      localStorage.setItem(CURRENT_USER_KEY, username.trim());
      setLoading(false);
      onLogin();
    }, 800);
  };

  const handleRegister = () => {
    setError("");
    setSuccess("");
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (username.trim() === "admin") {
      setError("Username not available. Please choose another.");
      return;
    }
    const users = loadUsers();
    if (users.some((u) => u.username === username.trim())) {
      setError("Username already taken. Please choose another.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const newUser: StoredUser = {
        username: username.trim(),
        passwordHash: hashPassword(password),
      };
      saveUsers([...users, newUser]);
      setLoading(false);
      setSuccess("Account created! You can now log in.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    }, 800);
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start"
      style={{
        background:
          "linear-gradient(160deg, #0a1a4f 0%, #1565C0 55%, #1976D2 100%)",
        minHeight: "100dvh",
      }}
    >
      {/* Logo area */}
      <div className="flex flex-col items-center pt-14 pb-2">
        <motion.div
          animate={{ y: [0, -10, 0], scale: [1, 1.04, 1] }}
          transition={{
            duration: 3.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{
            borderRadius: "50%",
            border: `3px solid ${GOLD}`,
            boxShadow: `0 0 24px ${GOLD}55, 0 8px 32px rgba(0,0,0,0.35)`,
            background: "#fff",
            width: 96,
            height: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src="/assets/uploads/screenshot_2026-03-24_145706-019d1f2e-f1c7-7437-9a18-ac548b271eee-1.png"
            alt="BP•PAY Logo"
            style={{
              width: 86,
              height: 86,
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-4 text-center"
        >
          <h1
            style={{
              color: "#ffffff",
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: 6,
              textShadow: `0 2px 12px ${GOLD}55`,
            }}
          >
            BP•PAY
          </h1>
          <p
            style={{
              color: "#90caf9",
              fontSize: 11,
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            SECURE PAYMENT GATEWAY
          </p>
        </motion.div>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.4,
          duration: 0.55,
          type: "spring",
          stiffness: 200,
        }}
        className="mx-4 w-full"
        style={{ maxWidth: 360 }}
      >
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#ffffff",
            border: `1.5px solid ${GOLD}44`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          {/* Tab strip */}
          <div className="flex" style={{ borderBottom: `2px solid ${GOLD}33` }}>
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                data-ocid={`auth.${m}_tab`}
                className="flex-1 py-3.5 text-sm font-bold transition-all"
                style={{
                  background: mode === m ? "#1565C0" : "transparent",
                  color: mode === m ? "#ffffff" : "#9ca3af",
                  letterSpacing: 1,
                }}
              >
                {m === "login" ? "LOGIN" : "REGISTER"}
              </button>
            ))}
          </div>

          <div className="px-6 py-6">
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 px-4 py-3 rounded-xl text-green-700 text-sm font-semibold"
                  style={{ background: "#f0fdf4", border: "1px solid #86efac" }}
                >
                  ✓ {success}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "register" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "register" ? -20 : 20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-gray-600">
                    Username
                  </Label>
                  <Input
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-xl text-sm text-gray-800"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                    data-ocid="auth.input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && mode === "login") handleLogin();
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-gray-600">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl text-sm text-gray-800 pr-10"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                      data-ocid="auth.password_input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && mode === "login")
                          handleLogin();
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "register" && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-gray-600">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl text-sm text-gray-800 pr-10"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                        data-ocid="auth.confirm_input"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRegister();
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-red-500 text-xs font-semibold text-center px-2 py-2 rounded-lg"
                      style={{
                        background: "#fff5f5",
                        border: "1px solid #fecaca",
                      }}
                      data-ocid="auth.error_state"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  className="w-full rounded-xl font-black text-base py-5"
                  style={{
                    background: "linear-gradient(135deg, #1565C0, #1976D2)",
                    color: "#fff",
                    boxShadow: "0 4px 16px rgba(21,101,192,0.4)",
                  }}
                  onClick={mode === "login" ? handleLogin : handleRegister}
                  disabled={loading}
                  data-ocid={
                    mode === "login"
                      ? "auth.login_button"
                      : "auth.register_button"
                  }
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : mode === "login" ? (
                    "Login"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500 mt-1">
                  {mode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        className="font-bold underline"
                        style={{ color: "#1565C0" }}
                        onClick={() => switchMode("register")}
                        data-ocid="auth.switch_to_register"
                      >
                        Register here
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="font-bold underline"
                        style={{ color: "#1565C0" }}
                        onClick={() => switchMode("login")}
                        data-ocid="auth.switch_to_login"
                      >
                        Login
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p
          className="text-center text-[10px] mt-4 pb-8"
          style={{ color: "#64b5f6" }}
        >
          © {new Date().getFullYear()} BP•PAY. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "./backend-api";
export default function AccountForm({
  member = false,
  onDone,
}: {
  member?: boolean;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "reset">("sign-in");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const prefix = member ? "/api/member-auth" : "/api/auth";
  // Owners can use the account they already have in the other products.
  const [sharedAccount, setSharedAccount] = useState(false);
  useEffect(() => {
    if (member) return;
    api<{ sharedAccount?: boolean }>("/api/backend-status")
      .then((status) => setSharedAccount(Boolean(status.sharedAccount)))
      .catch(() => setSharedAccount(false));
  }, [member]);
  async function continueWithSharedAccount() {
    setBusy(true);
    setError("");
    try {
      // The marker tells the dashboard to open the server workspace on return.
      const back = new URL(location.href);
      back.searchParams.set("shared-account", "1");
      const { url } = await api<{ url: string }>("/api/auth/sign-in/social", {
        provider: "platform",
        callbackURL: back.toString(),
      });
      location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <form
      className="backend-form auth-card"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          const result = await api(
            `${prefix}/${mode === "reset" ? "request-password-reset" : `${mode}/email`}`,
            mode === "reset"
              ? {
                  email: f.get("email"),
                  redirectTo: `${location.origin}/reset-password?member=${member ? "1" : "0"}`,
                }
              : {
                  name: f.get("name") || "Member",
                  email: f.get("email"),
                  password: f.get("password"),
                  callbackURL: location.href,
                },
          );
          if (mode === "reset")
            setError("If the account exists, a reset link has been sent.");
          else if (mode === "sign-up" && !result.token)
            setError("Check your email to verify your account, then sign in.");
          else onDone();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>
        {mode === "sign-up"
          ? "Create your account"
          : mode === "reset"
            ? "Reset password"
            : "Welcome back"}
      </h3>
      {sharedAccount && mode !== "reset" && (
        <div className="shared-account">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void continueWithSharedAccount()}
          >
            Continue with your account
          </button>
          <small>
            The same sign-in as your other products: a wallet or an email code.
            Paid actions are paid for one at a time, on the same payment sheet.
          </small>
          <span className="shared-account-divider">
            or use a Plotform password
          </span>
        </div>
      )}
      {mode === "sign-up" && (
        <input
          name="name"
          aria-label="Name"
          placeholder="Your name..."
          required
          maxLength={100}
        />
      )}
      <input
        name="email"
        type="email"
        aria-label="Email"
        placeholder="Email address..."
        required
        autoComplete="email"
      />
      {mode !== "reset" && (
        <div className="auth-password">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            aria-label="Password"
            placeholder={
              mode === "sign-up" ? "Password, 12 characters or more..." : "Password..."
            }
            minLength={12}
            required
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
          />
          <button
            type="button"
            className="auth-eye"
            aria-label={showPassword ? "Hide what you typed" : "Show what you typed"}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      )}
      <button
        disabled={busy}
        className={member ? "dark-button auth-submit" : "primary auth-submit"}
      >
        {busy
          ? "Please wait…"
          : mode === "sign-up"
            ? "Create account"
            : mode === "reset"
              ? "Send reset link"
              : "Sign in"}
      </button>
      <div className="auth-links">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-up" ? "sign-in" : "sign-up");
            setError("");
          }}
        >
          {mode === "sign-up"
            ? "Already have an account?"
            : "Create account instead"}
        </button>
        <button type="button" onClick={() => setMode("reset")}>
          Forgot password?
        </button>
      </div>
      {error && <p role="status">{error}</p>}
    </form>
  );
}
export function ResetPassword() {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  return (
    <main className="backend-page">
      <h1>Reset your password</h1>
      <form
        className="backend-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const query = new URLSearchParams(location.search);
          try {
            await api(
              `/api/${query.get("member") === "1" ? "member-auth" : "auth"}/reset-password`,
              {
                token: query.get("token"),
                newPassword: new FormData(e.currentTarget).get("password"),
              },
            );
            setDone(true);
            setMessage("Password updated. Return to your app and sign in.");
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <label>
          New password
          <input name="password" type="password" minLength={12} required />
        </label>
        <button disabled={done}>Update password</button>
        <p role="status">{message}</p>
      </form>
    </main>
  );
}

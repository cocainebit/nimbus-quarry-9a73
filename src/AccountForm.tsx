import { useEffect, useState } from "react";
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
      className="backend-form"
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
      {sharedAccount && mode !== "reset" && (
        <div className="shared-account">
          <button
            type="button"
            className="dark-button"
            disabled={busy}
            onClick={() => void continueWithSharedAccount()}
          >
            Continue with your account
          </button>
          <small>
            The same sign-in as your other products: a wallet or an email
            code. Credits are shared.
          </small>
          <span className="shared-account-divider">or use a Plotform password</span>
        </div>
      )}
      <h3>
        {mode === "sign-up"
          ? "Create an account"
          : mode === "reset"
            ? "Reset password"
            : "Sign in"}
      </h3>
      {mode === "sign-up" && (
        <label>
          Name
          <input name="name" required maxLength={100} />
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {mode !== "reset" && (
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={12}
            required
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
          />
        </label>
      )}
      <button disabled={busy} className="dark-button">
        {busy
          ? "Please wait…"
          : mode === "sign-up"
            ? "Create account"
            : mode === "reset"
              ? "Send reset link"
              : "Sign in"}
      </button>
      <div className="backend-actions">
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

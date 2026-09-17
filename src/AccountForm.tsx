import { useState } from "react";
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

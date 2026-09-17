import { useEffect, useState } from "react";
import { api } from "./backend-api";

type SharedAccount =
  | { enabled: false }
  | { enabled: true; connected: false; accountUrl: string }
  | {
      enabled: true;
      connected: true;
      accountUrl: string;
      email: string | null;
      organization: string | null;
    };

/**
 * Says that this workspace is signed in with the shared account, and links to it.
 * There is no balance to show: each paid action is paid for on its own.
 */
export default function AccountChip({ userId }: { userId?: string }) {
  const [account, setAccount] = useState<SharedAccount | null>(null);
  useEffect(() => {
    if (!userId) return setAccount(null);
    let live = true;
    api<SharedAccount>("/api/shared-account")
      .then((value) => live && setAccount(value))
      .catch(() => live && setAccount(null));
    return () => {
      live = false;
    };
  }, [userId]);
  if (!account?.enabled || !account.connected) return null;
  return (
    <a
      className="account-chip"
      href={account.accountUrl}
      target="_blank"
      rel="noreferrer"
      title="Your shared account: sign-in and payment history"
    >
      Shared account
      <strong>{account.email || account.organization || "Signed in"}</strong>
    </a>
  );
}

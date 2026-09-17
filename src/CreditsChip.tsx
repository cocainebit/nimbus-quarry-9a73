import { useEffect, useState } from "react";
import { api } from "./backend-api";

type Credits =
  | { enabled: false }
  | { enabled: true; connected: false; accountUrl: string }
  | { enabled: true; connected: true; accountUrl: string; balanceMicro: number; organization: { name: string } };

const usdc = (micro: number) => (micro / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The shared credit balance from the platform account, shown in the dashboard header for signed-in owners. */
export default function CreditsChip({ userId }: { userId?: string }) {
  const [credits, setCredits] = useState<Credits | null>(null);
  useEffect(() => {
    if (!userId) return setCredits(null);
    let live = true;
    api<Credits>("/api/credits")
      .then((value) => live && setCredits(value))
      .catch(() => live && setCredits(null));
    return () => {
      live = false;
    };
  }, [userId]);
  if (!credits?.enabled) return null;
  if (!credits.connected)
    return (
      <a className="credits-chip" href={credits.accountUrl} target="_blank" rel="noreferrer" title="Paid actions use your shared account's credits">
        Credits not connected
      </a>
    );
  return (
    <a className="credits-chip" href={credits.accountUrl} target="_blank" rel="noreferrer" title={`${credits.organization.name} balance, shared across products`}>
      Credits <strong>{usdc(credits.balanceMicro)} USDC</strong>
    </a>
  );
}

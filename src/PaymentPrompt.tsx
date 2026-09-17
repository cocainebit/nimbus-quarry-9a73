import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

// One prompt for every paid action, opened from `api()` when the server answers
// 402 with a charge. Nothing is stored up: this payment covers this action only.
// The prompt opens the platform's payment sheet in its own window, follows the
// charge until it is paid, and hands the answer back so the action runs.

export type PaymentRequest = {
  payUrl: string;
  chargeId: string;
  amountMicro?: number;
  asset?: string;
  description?: string;
};

/** "paid": run the action. "again": ask for a new charge. "cancelled": stop. */
export type PaymentOutcome = "paid" | "again" | "cancelled";

type ChargeView = {
  status?: string;
  amountMicro?: number;
  asset?: string;
  description?: string;
  failureReason?: string | null;
  expired?: boolean;
};

type Stage =
  | "waiting"
  | "blocked"
  | "closed"
  | "confirming"
  | "paid"
  | "failed"
  | "expired";

/** Amounts come from the charge. Without one, the prompt shows no amount at all. */
function amountLabel(micro?: number, asset?: string) {
  if (typeof micro !== "number" || !Number.isFinite(micro)) return "";
  const value = (micro / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return asset ? `${value} ${asset}` : value;
}

function PaymentSheet({
  request,
  onDone,
}: {
  request: PaymentRequest;
  onDone: (outcome: PaymentOutcome) => void;
}) {
  const [stage, setStage] = useState<Stage>("waiting");
  const [charge, setCharge] = useState<ChargeView | null>(null);
  const [reachable, setReachable] = useState(true);
  const sheet = useRef<Window | null>(null);

  function openSheet() {
    const opened = window.open(
      request.payUrl,
      "plotform-payment",
      "width=460,height=700",
    );
    sheet.current = opened;
    setStage(opened ? "waiting" : "blocked");
    opened?.focus();
  }

  useEffect(() => {
    openSheet();
    let live = true;
    let timer = 0;
    async function follow() {
      let view: ChargeView | null = null;
      try {
        const response = await fetch(
          `/api/charges/${encodeURIComponent(request.chargeId)}`,
          { credentials: "same-origin" },
        );
        if (!response.ok) throw new Error(String(response.status));
        view = (await response.json()) as ChargeView;
      } catch {
        if (live) setReachable(false);
        return false;
      }
      if (!live) return true;
      setReachable(true);
      setCharge(view);
      if (view.status === "paid") {
        setStage("paid");
        try {
          sheet.current?.close();
        } catch {
          // The payment window may have navigated away from us; leave it alone.
        }
        window.setTimeout(() => live && onDone("paid"), 800);
        return true;
      }
      if (view.status === "failed") {
        setStage("failed");
        return true;
      }
      if (view.expired || view.status === "expired") {
        setStage("expired");
        return true;
      }
      if (view.status === "settlement_pending") setStage("confirming");
      else if (sheet.current?.closed) setStage("closed");
      else setStage((current) => (current === "blocked" ? current : "waiting"));
      return false;
    }
    const tick = () =>
      void follow().then((stop) => {
        if (stop) window.clearInterval(timer);
      });
    timer = window.setInterval(tick, 2000);
    tick();
    return () => {
      live = false;
      window.clearInterval(timer);
    };
    // One prompt follows one charge; a new charge mounts a new prompt.
  }, [request.chargeId]);

  const description =
    charge?.description || request.description || "This action";
  const amount = amountLabel(
    charge?.amountMicro ?? request.amountMicro,
    charge?.asset ?? request.asset,
  );
  const message: Record<Stage, string> = {
    waiting:
      "The payment window is open. Complete the payment there and this action continues on its own.",
    blocked:
      "Your browser kept the payment window from opening. Open it yourself to continue.",
    closed:
      "The payment window closed before the payment was complete. Nothing was paid.",
    confirming: "The payment is being confirmed. This takes a moment.",
    paid: "Paid. Continuing with your action.",
    failed: charge?.failureReason
      ? `The payment did not go through: ${charge.failureReason}`
      : "The payment did not go through. Nothing was paid.",
    expired:
      "This payment request expired before it was paid. Trying again asks for a new one.",
  };
  const retryable = stage === "failed" || stage === "expired";

  return (
    <div className="modal-backdrop">
      <div
        className="modal payment-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Pay for this action"
      >
        {stage !== "paid" && (
          <button
            className="modal-close"
            onClick={() => onDone("cancelled")}
            aria-label="Close without paying"
          >
            ✕
          </button>
        )}
        <h2>Pay to continue</h2>
        <p>
          Each action is paid for on its own, on the same payment sheet as your
          other products. This payment covers this action only.
        </p>
        <dl className="payment-lines">
          <div>
            <dt>Paying for</dt>
            <dd>{description}</dd>
          </div>
          {amount && (
            <div>
              <dt>Amount</dt>
              <dd>
                <strong>{amount}</strong>
              </dd>
            </div>
          )}
        </dl>
        <p
          className={`payment-state${retryable ? " payment-state-warn" : ""}`}
          role="status"
        >
          {message[stage]}
        </p>
        {!reachable && stage !== "paid" && (
          <p className="payment-state payment-state-warn" role="status">
            Plotform cannot read the payment status right now. It keeps trying.
          </p>
        )}
        <div className="payment-actions">
          {retryable && (
            <button className="dark-button" onClick={() => onDone("again")}>
              Try again
            </button>
          )}
          {(stage === "waiting" ||
            stage === "blocked" ||
            stage === "closed") && (
            <button
              className={stage === "waiting" ? "secondary" : "dark-button"}
              onClick={openSheet}
            >
              {stage === "waiting"
                ? "Bring the payment window forward"
                : "Open the payment window"}
            </button>
          )}
          {stage !== "paid" && (
            <button className="secondary" onClick={() => onDone("cancelled")}>
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

let host: HTMLDivElement | null = null;
let root: Root | null = null;
let close: ((outcome: PaymentOutcome) => void) | null = null;

/**
 * Opens the payment prompt for one charge and resolves when the person is done
 * with it. Called by `api()`, so every product surface asks the same way.
 */
export function payForAction(request: PaymentRequest): Promise<PaymentOutcome> {
  // A prompt already open belongs to an earlier action: let that one give up so
  // its request stops waiting.
  close?.("cancelled");
  if (!host) {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  }
  return new Promise<PaymentOutcome>((resolve) => {
    close = (outcome) => {
      close = null;
      root?.render(null);
      resolve(outcome);
    };
    root?.render(<PaymentSheet request={request} onDone={(o) => close?.(o)} />);
  });
}

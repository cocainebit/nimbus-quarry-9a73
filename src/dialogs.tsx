import { useEffect, useRef, useState } from "react";

type Request = {
  kind: "confirm" | "alert";
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
};

let show: ((request: Request) => void) | null = null;

function open(request: Omit<Request, "resolve">) {
  return new Promise<boolean>((resolve) => {
    // Before the host mounts there is nothing of ours to draw on.
    if (!show)
      return resolve(
        request.kind === "alert"
          ? (window.alert(request.message), true)
          : window.confirm(request.message),
      );
    show({ ...request, resolve });
  });
}

export function confirmDialog(
  message: string,
  options: { confirmLabel?: string; danger?: boolean } = {},
) {
  return open({
    kind: "confirm",
    message,
    confirmLabel: options.confirmLabel || "OK",
    danger: Boolean(options.danger),
  });
}

export function alertDialog(message: string) {
  return open({ kind: "alert", message, confirmLabel: "OK", danger: false });
}

export function DialogHost() {
  const [request, setRequest] = useState<Request | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    show = (next) => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setRequest((current) => {
        current?.resolve(false);
        return next;
      });
    };
    return () => {
      show = null;
    };
  }, []);

  useEffect(() => {
    if (request) confirmRef.current?.focus();
  }, [request]);

  if (!request) return null;
  const close = (ok: boolean) => {
    request.resolve(ok);
    setRequest(null);
    returnFocus.current?.focus?.();
  };
  // The sentence up to the first question mark or full stop is the title.
  const split = request.message.match(/^(.+?[?.])\s+(.+)$/s);
  const title = split ? split[1] : request.message;
  const detail = split ? split[2] : "";
  return (
    <div
      className="modal-backdrop ask-backdrop"
      onClick={() => close(request.kind === "alert")}
    >
      <div
        className="ask"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ask-title"
        aria-describedby={detail ? "ask-detail" : undefined}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            close(request.kind === "alert");
          }
          if (e.key === "Tab") {
            // Keep focus on our buttons; the page behind is not available.
            const buttons = [...e.currentTarget.querySelectorAll("button")];
            const at = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            e.preventDefault();
            buttons[
              (at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length
            ]?.focus();
          }
        }}
      >
        <div className="ask-body">
          <h2 id="ask-title">{title}</h2>
          {detail && <p id="ask-detail">{detail}</p>}
        </div>
        <div className="ask-actions">
          {request.kind === "confirm" && (
            <button className="secondary" onClick={() => close(false)}>
              Cancel
            </button>
          )}
          <button
            ref={confirmRef}
            className={request.danger ? "dark-button" : "primary"}
            onClick={() => close(true)}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

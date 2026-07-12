"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
  initiateMobilePaymentAction,
  checkMobilePaymentAction,
  type PayPurpose,
} from "@/app/student/actions";
import type { MobileMethod } from "@/services/payments";

type Phase = "form" | "waiting" | "paid" | "error";

interface Props {
  purpose: PayPurpose;
  title: string;
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
  triggerVariant?: "default" | "brand" | "outline";
  /** Fixed amount (rent). Omit for a student-entered amount (transport). */
  amount?: number;
  defaultPhone?: string;
}

export function MobilePaymentDialog({
  purpose,
  title,
  triggerLabel,
  triggerIcon,
  triggerClassName,
  triggerVariant = "outline",
  amount,
  defaultPhone,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("form");
  const [phone, setPhone] = React.useState(defaultPhone ?? "");
  const [method, setMethod] = React.useState<MobileMethod>("ecocash");
  const [customAmount, setCustomAmount] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const editableAmount = amount === undefined;

  const stopPolling = React.useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  React.useEffect(() => () => stopPolling(), [stopPolling]);

  function reset() {
    stopPolling();
    setPhase("form");
    setInstructions("");
    setErrorMsg("");
    setBusy(false);
  }

  async function submit() {
    setBusy(true);
    setErrorMsg("");
    const res = await initiateMobilePaymentAction({
      purpose,
      phone,
      method,
      amount: editableAmount ? Number(customAmount) : amount,
    });
    setBusy(false);
    if (!res.success || !res.reference) {
      setErrorMsg(res.error ?? "Could not start the payment.");
      return;
    }
    setInstructions(res.instructions ?? "Check your phone to approve the payment.");
    setPhase("waiting");
    startPolling(res.reference);
  }

  function startPolling(reference: string) {
    stopPolling();
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 4;
      const r = await checkMobilePaymentAction(reference);
      if (r.status === "paid") {
        stopPolling();
        setPhase("paid");
        toast.success("Payment received — thank you!");
        router.refresh();
      } else if (r.status === "failed") {
        stopPolling();
        setErrorMsg(r.error ?? "The payment was not completed.");
        setPhase("error");
      } else if (elapsed >= 120) {
        stopPolling();
        setErrorMsg(
          "We haven't received confirmation yet. If you approved it on your phone, it may still be processing — check your payments shortly.",
        );
        setPhase("error");
      }
    }, 4000);
  }

  const resolvedAmount = editableAmount ? Number(customAmount || 0) : amount ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName}>
          {triggerIcon}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {phase === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Pay with EcoCash or OneMoney — enter the number you want to pay
                with and approve the prompt on your phone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {editableAmount ? (
                <div className="space-y-1.5">
                  <Label htmlFor="mp-amount">Amount (USD)</Label>
                  <Input
                    id="mp-amount"
                    type="number"
                    min={1}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="e.g. 20"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-muted/60 p-3.5 text-center">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-display text-2xl font-bold">
                    {formatCurrency(resolvedAmount)}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="mp-method">Pay with</Label>
                <Select
                  id="mp-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as MobileMethod)}
                >
                  <option value="ecocash">EcoCash</option>
                  <option value="onemoney">OneMoney</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-phone">Mobile number to pay with</Label>
                <Input
                  id="mp-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0771234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-rose-600">{errorMsg}</p>
              )}

              <Button
                variant="brand"
                className="w-full"
                disabled={busy}
                onClick={submit}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Smartphone className="size-4" />
                )}
                {busy
                  ? "Sending prompt…"
                  : `Send prompt${resolvedAmount ? ` · ${formatCurrency(resolvedAmount)}` : ""}`}
              </Button>
            </div>
          </>
        )}

        {phase === "waiting" && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
              <Smartphone className="size-7 text-brand-700" />
            </div>
            <DialogTitle className="text-center">Check your phone</DialogTitle>
            <p className="text-sm text-muted-foreground">{instructions}</p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Waiting for you to approve…
            </div>
          </div>
        )}

        {phase === "paid" && (
          <div className="space-y-3 py-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <DialogTitle className="text-center">Payment received</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Thank you! Your receipt is available in your payments.
            </p>
            <Button
              variant="brand"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3 py-2 text-center">
            <DialogTitle className="text-center">Payment not completed</DialogTitle>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="brand" className="flex-1" onClick={reset}>
                Try again <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

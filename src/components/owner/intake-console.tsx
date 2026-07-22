"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Upload, Send, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createAdminAccount,
  importMufudziIntake,
  sendCredentialsBatch,
} from "@/app/owner/intake/actions";
import type { ActionResult } from "@/types";

interface Props {
  intakeCount: number;
  studentCount: number;
  unsentCount: number;
  mufudziExists: boolean;
}

export function IntakeConsole({
  intakeCount,
  studentCount,
  unsentCount,
  mufudziExists,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [resetConfirm, setResetConfirm] = useState("");

  function run(fn: () => Promise<ActionResult>) {
    startTransition(async () => {
      const res = await fn();
      if (res.success) toast.success(res.message || "Done");
      else toast.error(res.error || "Something went wrong");
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox label="Students in system" value={studentCount} icon={<Users className="size-5" />} />
        <StatBox label="Awaiting credentials" value={unsentCount} icon={<Send className="size-5" />} />
        <StatBox label="Mufudzi intake list" value={intakeCount} icon={<Upload className="size-5" />} />
      </div>

      {/* 1. Admin account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" /> 1 · Admin account
          </CardTitle>
          <CardDescription>
            Create or reset the owner/admin login. It&apos;s issued a temporary
            password and forced to set a new one on first sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => run(() => createAdminAccount(fd))}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" name="email" type="email" defaultValue="Blessingc@owner.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Name</Label>
              <Input id="admin-name" name="name" defaultValue="Blessing C" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Phone (for SMS)</Label>
              <Input id="admin-phone" name="phone" placeholder="07…" />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" variant="brand" disabled={pending}>
                <UserPlus className="size-4" /> Create / refresh admin & send login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Import Mufudzi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" /> 2 · Import Mufudzi House ({intakeCount} students)
          </CardTitle>
          <CardDescription>
            Creates a portal account for each student and records their paid
            deposit. Credentials are <strong>not</strong> sent here — do that in
            step 3 after you&apos;ve verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mufudziExists && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>Mufudzi House isn&apos;t seeded yet. Seed the houses before importing.</span>
            </div>
          )}
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
              <AlertTriangle className="size-4" /> Optional: clear existing tenant data first
            </p>
            <p className="mt-1 text-xs text-rose-700/80">
              Type <code className="font-mono font-bold">RESET</code> to delete all
              current students, applications, invoices, payments &amp; receipts
              before importing. Houses, rooms and owner accounts are kept. Leave
              blank to import alongside existing data.
            </p>
            <Input
              name="confirm-preview"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder="Leave blank, or type RESET"
              className="mt-3 max-w-xs"
            />
          </div>
          <form action={(fd) => run(() => importMufudziIntake(fd))}>
            <input type="hidden" name="confirm" value={resetConfirm} />
            <Button type="submit" variant="brand" disabled={pending || !mufudziExists}>
              <Upload className="size-4" />
              {resetConfirm.trim() === "RESET"
                ? "Reset tenant data & import Mufudzi"
                : "Import Mufudzi students"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Send credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-5" /> 3 · Send login credentials
          </CardTitle>
          <CardDescription>
            Emails + texts each student their login and a fresh temporary
            password. Each send rotates the password so what&apos;s delivered
            always works.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => run(() => sendCredentialsBatch(fd))}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="space-y-1.5">
              <Label htmlFor="scope">Send to</Label>
              <Select id="scope" name="scope" defaultValue="unsent" className="sm:w-64">
                <option value="unsent">Only students not yet notified ({unsentCount})</option>
                <option value="all">All students ({studentCount})</option>
              </Select>
            </div>
            <Button type="submit" variant="brand" disabled={pending || studentCount === 0}>
              <Send className="size-4" /> Send credentials
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

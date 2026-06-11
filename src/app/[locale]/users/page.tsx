"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Shield, AlertCircle, Loader2, Ban, CheckCircle } from "lucide-react";

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

interface CurrentUser {
  role: string;
}

export default function UsersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "VIEWER", isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users ?? data.data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authorized");
      const data = await res.json();
      const user = data.user ?? data;
      setCurrentUser({ role: user.role });
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (currentUser?.role === "SUPER_ADMIN") {
      fetchUsers();
    } else if (currentUser && currentUser.role !== "SUPER_ADMIN") {
      setLoading(false);
    }
  }, [currentUser, fetchUsers]);

  const roleOptions = [
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ADMIN", label: "Admin" },
    { value: "MANAGER", label: "Manager" },
    { value: "VIEWER", label: "Viewer" },
  ];

  const openAddDialog = () => {
    setEditingUser(null);
    setForm({ fullName: "", email: "", phone: "", password: "", role: "VIEWER", isActive: true });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setForm({ fullName: user.fullName, email: user.email, phone: user.phone ?? "", password: "", role: user.role, isActive: user.isActive });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const errors: Partial<Record<string, string>> = {};
    if (!form.fullName.trim()) errors.fullName = t("validation.required");
    if (!form.email.trim()) errors.email = t("validation.required");
    if (!editingUser && !form.password.trim()) errors.password = t("validation.required");
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      const body: Record<string, unknown> = { fullName: form.fullName, email: form.email, phone: form.phone, role: form.role, isActive: form.isActive };
      if (form.password) body.password = form.password;

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      setDialogOpen(false);
      fetchUsers();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    try {
      const res = await fetch(`/api/users/${toggleTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !toggleTarget.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      setConfirmDialogOpen(false);
      setToggleTarget(null);
      fetchUsers();
    } catch {
      //
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout locale={locale} title={t("users.title")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton variant="rectangular" className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return (
      <DashboardLayout locale={locale} title={t("users.title")}>
        <EmptyState
          icon={<Shield className="size-8" />}
          title={t("errors.forbidden")}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("users.title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("users.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("users.subtitle")}</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            {t("users.new")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("users.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertCircle className="size-8" />}
                title={t("common.error")}
                action={{ label: t("errors.retry"), onClick: fetchUsers }}
              />
            ) : users.length === 0 ? (
              <EmptyState
                icon={<Shield className="size-8" />}
                title={t("common.noData")}
                action={{ label: t("users.new"), onClick: openAddDialog }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("users.fullName")}</TableHead>
                      <TableHead>{t("users.email")}</TableHead>
                      <TableHead>{t("users.phone")}</TableHead>
                      <TableHead>{t("users.role")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("users.lastLogin")}</TableHead>
                      <TableHead className="text-end">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                        <TableCell>
                          <StatusBadge status={user.isActive ? "active" : "inactive"} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{user.lastLogin ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setToggleTarget(user); setConfirmDialogOpen(true); }}
                            >
                              {user.isActive ? <Ban className="size-4 text-red-500" /> : <CheckCircle className="size-4 text-green-500" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? t("users.edit") : t("users.new")}</DialogTitle>
              <DialogDescription>{t("common.submit")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t("users.fullName")} *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  error={formErrors.fullName}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("users.email")} *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  error={formErrors.email}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("users.phone")}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("users.password")}{!editingUser ? " *" : ""}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  error={formErrors.password}
                  placeholder={editingUser ? t("common.optional") ?? "Leave empty to keep current" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("users.role")}</Label>
                <Select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  options={roleOptions}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isActive">{t("users.isActive")}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("common.confirm")}</DialogTitle>
              <DialogDescription>{t("users.deactivateConfirm")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant={toggleTarget?.isActive ? "destructive" : "default"} onClick={handleToggleActive}>
                {toggleTarget?.isActive ? t("common.deactivate") ?? "Deactivate" : t("common.activate") ?? "Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

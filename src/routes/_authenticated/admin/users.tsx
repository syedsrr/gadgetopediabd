import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listUsersWithRoles, setUserRole, type ManagedRole } from "@/lib/adminUsers.functions";
import { useSession } from "@/lib/useAdmin";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UserRoles,
});

const ROLES: ManagedRole[] = ["admin", "staff", "customer"];

function UserRoles() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const myId = session?.user?.id;

  const loadUsers = useServerFn(listUsersWithRoles);
  const saveRole = useServerFn(setUserRole);

  const [search, setSearch] = useState("");

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => loadUsers({}) });

  const change = useMutation({
    mutationFn: (vars: { userId: string; role: ManagedRole }) => saveRole({ data: vars }),
    onSuccess: async () => {
      toast.success("Role updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) =>
      toast.error(
        e.message === "Forbidden" ? "Only administrators can change roles" : e.message,
      ),
  });

  const term = search.trim().toLowerCase();
  const rows = (users.data ?? []).filter((u) =>
    term
      ? [u.full_name, u.email, u.phone].some((v) => (v ?? "").toLowerCase().includes(term))
      : true,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">User roles</h1>
        <p className="text-sm text-muted-foreground">
          Decide who can manage the store. Shoppers stay on “customer”.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone"
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead className="w-44">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.isPending ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm">
                      <p className="text-muted-foreground">We could not load the people list.</p>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm">
                      <p className="text-muted-foreground">Nobody matches that search.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => {
                    const current: ManagedRole = u.roles.includes("admin")
                      ? "admin"
                      : u.roles.includes("staff")
                        ? "staff"
                        : "customer";
                    const isMe = u.id === myId;
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <p className="font-medium">
                            {u.full_name || "Unnamed shopper"}
                            {isMe && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="block">{u.email ?? "—"}</span>
                          <span className="block">{u.phone ?? "—"}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={current === "admin" ? "default" : "secondary"}>
                            {current === "admin" && <ShieldCheck className="mr-1 h-3 w-3" />}
                            {current}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={current}
                            disabled={change.isPending || (isMe && current === "admin")}
                            onValueChange={(v) =>
                              change.mutate({ userId: u.id, role: v as ManagedRole })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        You cannot change your own administrator role, so the store can never be locked out.
      </p>
    </div>
  );
}

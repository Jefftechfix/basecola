import { useDeferredValue, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Check, Mail, RefreshCw, Search, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  searchAdminEmailUsers,
  getAdminEmailAudience,
  listAdminEmailNotifications,
  sendAdminEmailNotification,
  type AdminEmailUser,
} from "@/lib/admin-notifications.functions";

export function AdminNotificationsManagement() {
  const queryClient = useQueryClient();
  const getAudience = useServerFn(getAdminEmailAudience);
  const searchUsers = useServerFn(searchAdminEmailUsers);
  const getHistory = useServerFn(listAdminEmailNotifications);
  const sendNotification = useServerFn(sendAdminEmailNotification);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [audience, setAudience] = useState<"all_active" | "selected_users">("all_active");
  const [userSearch, setUserSearch] = useState("");
  const deferredUserSearch = useDeferredValue(userSearch.trim());
  const [selectedUsers, setSelectedUsers] = useState<AdminEmailUser[]>([]);

  const audienceQuery = useQuery({
    queryKey: ["admin-email-audience"],
    queryFn: () => getAudience(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const historyQuery = useQuery({
    queryKey: ["admin-email-notifications"],
    queryFn: () => getHistory(),
    staleTime: 30_000,
  });
  const userSearchQuery = useQuery({
    queryKey: ["admin-email-user-search", deferredUserSearch],
    queryFn: () => searchUsers({ data: { query: deferredUserSearch } }),
    enabled: audience === "selected_users" && deferredUserSearch.length >= 2,
    staleTime: 15_000,
  });
  const sendMutation = useMutation({
    mutationFn: () =>
      sendNotification({
        data: {
          subject,
          message,
          confirmation,
          audience,
          selectedUserIds: selectedUsers.map((user) => user.id),
          expectedRecipientCount: recipientCount,
        },
      }),
    onSuccess: async () => {
      setConfirmOpen(false);
      setConfirmation("");
      setSelectedUsers([]);
      setUserSearch("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-email-notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-email-audience"] }),
      ]);
    },
  });

  const audienceCount = audienceQuery.data?.activeRecipientCount;
  const recipientCount = audience === "all_active" ? (audienceCount ?? 0) : selectedUsers.length;
  const canSend = subject.trim().length > 0 && message.trim().length > 0 && recipientCount > 0;
  const sendReady = confirmation === "SEND" && canSend && !sendMutation.isPending;

  function openConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    setConfirmation("");
    sendMutation.reset();
    setConfirmOpen(true);
  }

  return (
    <section className="space-y-5">
      <header className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Email notifications</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Send an operational account notice to all active users or selected users with valid
              email addresses. Suspended and deleted accounts are excluded. Emails use the
              configured Basecola sender.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              void audienceQuery.refetch();
              void historyQuery.refetch();
            }}
            disabled={audienceQuery.isFetching || historyQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${audienceQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        {audience === "all_active" && (
          <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
            <span className="font-semibold">Recipients: </span>
            {audienceQuery.isPending
              ? "Counting active accounts…"
              : audienceQuery.error
                ? "Unavailable"
                : `${audienceCount?.toLocaleString() ?? 0} active users with valid email addresses`}
          </div>
        )}
        {audience === "all_active" && audienceQuery.error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Could not count recipients: {audienceQuery.error.message}
          </p>
        )}
      </header>

      <form className="space-y-4 rounded-3xl bg-white p-5 shadow-sm" onSubmit={openConfirmation}>
        <div>
          <h2 className="font-bold">Compose notice</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This tool sends account and service notices, not promotional campaigns.
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Recipients</legend>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm">
            <input
              type="radio"
              name="notification-audience"
              value="all_active"
              checked={audience === "all_active"}
              onChange={() => setAudience("all_active")}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold">All active users</span>
              <span className="text-muted-foreground">
                Send to everyone with a valid email address.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm">
            <input
              type="radio"
              name="notification-audience"
              value="selected_users"
              checked={audience === "selected_users"}
              onChange={() => setAudience("selected_users")}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold">Select specific users</span>
              <span className="text-muted-foreground">
                Search by name or email, then choose one or more active users.
              </span>
            </span>
          </label>
        </fieldset>
        {audience === "selected_users" && (
          <div className="space-y-3 rounded-xl border p-3">
            <label className="relative block text-sm font-medium">
              Search active users
              <Search className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                className="mt-1 pl-9"
                placeholder="Enter at least 2 characters"
                autoComplete="off"
              />
            </label>
            {deferredUserSearch.length < 2 && (
              <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>
            )}
            {userSearchQuery.error && (
              <p role="alert" className="text-sm text-destructive">
                Could not search users: {userSearchQuery.error.message}
              </p>
            )}
            {userSearchQuery.isFetching && (
              <p className="text-xs text-muted-foreground">Searching users…</p>
            )}
            {(userSearchQuery.data?.length ?? 0) > 0 && (
              <ul aria-label="User search results" className="max-h-52 space-y-1 overflow-y-auto">
                {userSearchQuery.data?.map((user) => {
                  const isSelected = selectedUsers.some((selected) => selected.id === user.id);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          setSelectedUsers((current) =>
                            isSelected
                              ? current.filter((selected) => selected.id !== user.id)
                              : [...current, user],
                          )
                        }
                        className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="grid h-4 w-4 place-items-center rounded border">
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{user.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {deferredUserSearch.length >= 2 &&
              !userSearchQuery.isFetching &&
              !userSearchQuery.error &&
              !userSearchQuery.data?.length && (
                <p className="text-sm text-muted-foreground">
                  No active users with a valid email matched your search.
                </p>
              )}
            {selectedUsers.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Selected users ({selectedUsers.length})
                </p>
                <ul className="space-y-1">
                  {selectedUsers.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2 py-1.5 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {user.name} <span className="text-muted-foreground">({user.email})</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${user.email}`}
                        onClick={() =>
                          setSelectedUsers((current) =>
                            current.filter((selected) => selected.id !== user.id),
                          )
                        }
                        className="rounded p-1 hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {audience === "all_active" && audienceQuery.isPending
            ? "Counting active recipients…"
            : `${recipientCount.toLocaleString()} recipient${recipientCount === 1 ? "" : "s"} selected`}
        </p>
        <label className="block text-sm font-medium">
          Subject
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={200}
            required
            className="mt-1"
            placeholder="Important account update"
          />
        </label>
        <label className="block text-sm font-medium">
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={10_000}
            required
            rows={10}
            className="mt-1 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Write the message to send to active users…"
          />
          <span className="mt-1 block text-right text-xs text-muted-foreground">
            {message.length.toLocaleString()} / 10,000
          </span>
        </label>
        <Button
          type="submit"
          disabled={
            !canSend ||
            (audience === "all_active" && (audienceQuery.isPending || !!audienceQuery.error))
          }
        >
          <Send className="h-4 w-4" />
          Review and send
        </Button>
        {sendMutation.error && (
          <p role="alert" className="text-sm text-destructive">
            {sendMutation.error.message}
          </p>
        )}
        {sendMutation.data && (
          <p
            role={sendMutation.data.failedCount ? "alert" : "status"}
            className="flex items-start gap-2 text-sm"
          >
            {sendMutation.data.failedCount > 0 && (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            )}
            Notification {sendMutation.data.status}: {sendMutation.data.sentCount.toLocaleString()}{" "}
            sent, {sendMutation.data.failedCount.toLocaleString()} failed out of{" "}
            {sendMutation.data.recipientCount.toLocaleString()} recipients.
          </p>
        )}
      </form>

      <section className="overflow-x-auto rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Recent notifications</h2>
        {historyQuery.error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Could not load notification history: {historyQuery.error.message}
          </p>
        )}
        <table className="mt-3 w-full min-w-[700px] text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="p-2">Subject</th>
              <th className="p-2">Created</th>
              <th className="p-2">Status</th>
              <th className="p-2">Audience</th>
              <th className="p-2">Recipients</th>
              <th className="p-2">Sent</th>
              <th className="p-2">Failed</th>
            </tr>
          </thead>
          <tbody>
            {(historyQuery.data ?? []).map((notification) => (
              <tr key={notification.id} className="border-t">
                <td className="max-w-72 truncate p-2 font-semibold" title={notification.subject}>
                  {notification.subject}
                </td>
                <td className="whitespace-nowrap p-2">
                  {new Date(notification.created_at).toLocaleString()}
                </td>
                <td className="p-2 capitalize">{notification.status}</td>
                <td className="p-2">
                  {notification.audience === "all_active" ? "All active users" : "Selected users"}
                </td>
                <td className="p-2">{notification.recipient_count.toLocaleString()}</td>
                <td className="p-2">{notification.sent_count.toLocaleString()}</td>
                <td className="p-2">{notification.failed_count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {historyQuery.isPending && (
          <p className="mt-3 text-sm text-muted-foreground">Loading notification history…</p>
        )}
        {!historyQuery.isPending && !historyQuery.error && !historyQuery.data?.length && (
          <p className="mt-3 text-sm text-muted-foreground">No notifications have been sent.</p>
        )}
      </section>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!sendMutation.isPending) setConfirmOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm email notification</DialogTitle>
            <DialogDescription>
              This sends a real email to {recipientCount.toLocaleString()}{" "}
              {audience === "all_active" ? "active users" : "selected users"} using the configured
              sender. This action cannot be recalled.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-y-auto rounded-xl bg-muted/50 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Subject</p>
            <p className="mt-1 break-words text-sm font-semibold">{subject}</p>
            {audience === "selected_users" && (
              <>
                <p className="mt-3 text-xs font-semibold text-muted-foreground">Recipients</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {selectedUsers.map((user) => (
                    <li key={user.id} className="break-all">
                      {user.name} — {user.email}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-xs font-semibold text-muted-foreground">Message preview</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message}</p>
          </div>
          <label className="block text-sm">
            Type <strong>SEND</strong> to confirm
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              className="mt-1"
            />
          </label>
          {sendMutation.error && (
            <p role="alert" className="text-sm text-destructive">
              {sendMutation.error.message}
            </p>
          )}
          <Button
            type="button"
            disabled={!sendReady}
            onClick={() => sendMutation.mutate()}
            className="w-full"
          >
            {sendMutation.isPending
              ? "Sending emails…"
              : `Send to ${recipientCount.toLocaleString()} users`}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

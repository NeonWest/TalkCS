"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getNotifications, getUnreadCount, markRead, markAllRead } from "../api/notifications";
import type { NotificationItem } from "../api/notifications";
import { cn } from "../lib/utils";

const TYPE_ICON: Record<string, string> = {
  MENTION: "💬",
  REPLY: "↩️",
  VOTE_MILESTONE: "⭐",
  ACCEPTED_ANSWER: "✅",
  FOLLOW: "👤",
};

function Dot({ className }: { className?: string }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // Still poll every 30s
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: isOpen, // Only fetch when popover is open
  });

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    setIsOpen(false);
    navigate(item.link);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl"
          aria-label="Open notifications"
        >
          <Bell size={18} strokeWidth={2.5} aria-hidden="true" className="group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-primary hover:bg-primary/90 text-primary-foreground border-none text-[10px] animate-in zoom-in duration-300">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-85 p-2 bg-card border-border text-card-foreground shadow-2xl rounded-2xl backdrop-blur-xl" align="end" sideOffset={12}>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <div className="text-sm font-black uppercase tracking-widest text-foreground">Notifications</div>
          {unreadCount > 0 && (
            <button
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto no-scrollbar space-y-1">
          {isLoading ? (
            <div className="px-3 py-12 text-center text-xs font-bold text-muted-foreground animate-pulse">
              Syncing...
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-12 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
              No new alerts
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm transition-all hover:bg-accent cursor-pointer group/item",
                  !item.isRead && "bg-primary/5 border-l-2 border-primary"
                )}
                onClick={() => handleNotificationClick(item)}
              >
                <div className="relative flex items-start gap-4">
                    <span className="text-xl shrink-0" role="img" aria-label={item.type}>
                        {TYPE_ICON[item.type] ?? '🔔'}
                    </span>
                  <div className="flex-1 space-y-1">
                    <p className={cn(
                        "text-sm font-medium leading-snug",
                        item.isRead ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {item.message}
                    </p>
                    <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter flex items-center gap-1">
                      <Clock size={10} />
                      {timeAgo(item.createdAt)}
                    </div>
                  </div>
                  {!item.isRead && (
                    <div className="absolute end-0 self-center">
                      <Dot className="text-primary animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import type { ReactNode } from "react";
import { Bot, User2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatRelativeDate, getInitials } from "@/lib/utils";

export interface AdvisorConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isError?: boolean;
}

interface AdvisorMessageProps {
  message: AdvisorConversationMessage;
  userName?: string;
  children?: ReactNode;
}

function MessageBody({ content }: { content: string }) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const isList = lines.every((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line));

        if (isList) {
          const ordered = lines.every((line) => /^\d+\.\s+/.test(line));
          const ListTag = ordered ? "ol" : "ul";

          return (
            <ListTag
              key={`${blockIndex}-${block}`}
              className={cn("space-y-2 pl-5", ordered ? "list-decimal" : "list-disc")}
            >
              {lines.map((line) => (
                <li key={line} className="leading-6">
                  {line.replace(/^([-*]|\d+\.)\s+/, "")}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <div key={`${blockIndex}-${block}`} className="space-y-2">
            {lines.map((line) => {
              if (line.startsWith("### ")) {
                return (
                  <h4 key={line} className="text-sm font-semibold tracking-tight">
                    {line.replace(/^###\s+/, "")}
                  </h4>
                );
              }

              if (line.startsWith("## ")) {
                return (
                  <h3 key={line} className="text-base font-semibold tracking-tight">
                    {line.replace(/^##\s+/, "")}
                  </h3>
                );
              }

              if (line.startsWith("# ")) {
                return (
                  <h2 key={line} className="text-lg font-semibold tracking-tight">
                    {line.replace(/^#\s+/, "")}
                  </h2>
                );
              }

              return (
                <p key={line} className="text-current/90 leading-6">
                  {line}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function AdvisorMessage({ message, userName, children }: AdvisorMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <Avatar className="mt-1 h-10 w-10 border border-border/70 bg-background shadow-sm">
          <AvatarFallback className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[85%] space-y-2", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-[28px] px-5 py-4 shadow-sm",
            isUser
              ? "ml-auto bg-primary text-primary-foreground"
              : "border border-border/70 bg-background/95 text-foreground backdrop-blur",
            message.isError && "border-destructive/40 bg-destructive/5 text-destructive"
          )}
        >
          <MessageBody content={message.content} />
        </div>

        <div
          className={cn(
            "flex items-center gap-2 px-1 text-xs text-muted-foreground",
            isUser && "justify-end"
          )}
        >
          <span>{isUser ? (userName ?? "You") : "WealthWise Advisor"}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
          <span>{formatRelativeDate(message.createdAt)}</span>
        </div>

        {children}
      </div>

      {isUser && (
        <Avatar className="mt-1 h-10 w-10 border border-primary/20 bg-primary/10 shadow-sm">
          <AvatarFallback className="bg-primary/10 text-primary">
            {userName ? getInitials(userName) : <User2 className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

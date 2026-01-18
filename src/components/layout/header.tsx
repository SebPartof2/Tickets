"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    accessLevel: "user" | "admin";
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/tickets" className="font-semibold text-lg">
          Family Tickets
        </Link>

        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-2">
            <User className="h-4 w-4" />
            <span>{user.name}</span>
            {user.accessLevel === "admin" && (
              <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                Admin
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden md:flex"
            title="Settings"
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

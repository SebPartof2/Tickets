"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isAdmin: boolean;
}

export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/tickets",
      icon: Home,
      label: "Tickets",
    },
    {
      href: "/tickets/new",
      icon: Plus,
      label: "New",
    },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            icon: Shield,
            label: "Admin",
          },
        ]
      : []),
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around h-16 safe-area-bottom">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/tickets" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full",
                "touch-manipulation active:bg-accent transition-colors",
                "min-h-[44px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

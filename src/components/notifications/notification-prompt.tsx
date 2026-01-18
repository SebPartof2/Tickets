"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePush } from "@/hooks/use-push";

export function NotificationPrompt() {
  const { isSupported, isSubscribed, isLoading, subscribe } = usePush();
  const [dismissed, setDismissed] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const wasDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (!wasDismissed && isSupported && !isSubscribed && !isLoading) {
      setDismissed(false);
    }
  }, [isSupported, isSubscribed, isLoading]);

  const handleEnable = async () => {
    setIsSubscribing(true);
    try {
      await subscribe();
      setDismissed(true);
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("notification-prompt-dismissed", "true");
    setDismissed(true);
  };

  if (dismissed || !isSupported || isSubscribed || isLoading) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary/20 bg-primary/5 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">Enable Notifications</p>
              <p className="text-xs text-muted-foreground">
                Get notified when there are updates to your tickets
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  disabled={isSubscribing}
                  className="h-8"
                >
                  {isSubscribing ? "Enabling..." : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8"
                >
                  Not now
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

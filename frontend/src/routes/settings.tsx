import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Bell, Globe, Shield, CreditCard,
  Smartphone, Moon, HelpCircle, LogOut, Star, Languages, Eye,
  MessageSquare, Lock, Trash2, ChevronDown, AlertTriangle
} from "lucide-react";
import { useBackendAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-store";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type SettingItem = {
  icon: React.ElementType;
  label: string;
  description?: string;
  type: "link" | "toggle" | "select";
  value?: boolean | string;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

function SettingsPage() {
  const { refreshToken, clear } = useBackendAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";
  const [biometric, setBiometric] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const signOut = async () => {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }, { unauthenticated: true });
      }
    } catch { /* best effort */ } finally {
      clear();
      navigate({ to: '/login' });
    }
  };

  const sections: SettingSection[] = [
    {
      title: "Account",
      items: [
        { icon: Globe, label: "Language", description: "English (US)", type: "select" },
        { icon: CreditCard, label: "Currency", description: "USD – US Dollar", type: "select" },
        { icon: Languages, label: "Country/region", description: "Cameroon", type: "select" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon: Bell, label: "Push notifications", description: "Trip reminders, messages and updates", type: "toggle", value: notifications },
        { icon: MessageSquare, label: "Email notifications", description: "Promotional and booking emails", type: "toggle", value: true },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: Eye, label: "Profile visibility", description: "Public", type: "select" },
        { icon: Shield, label: "Two-step verification", description: "Add an extra layer of security", type: "link" },
        { icon: Lock, label: "Privacy settings", description: "Manage your data and activity", type: "link" },
        { icon: Smartphone, label: "Biometric login", description: "Use Face ID or fingerprint", type: "toggle", value: biometric },
      ],
    },
    {
      title: "Display",
      items: [
        { icon: Moon, label: "Dark mode", description: "Use dark theme", type: "toggle", value: darkMode },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "Get answers to your questions", type: "link" },
        { icon: Star, label: "Rate the app", description: "Tell us what you think", type: "link" },
        { icon: MessageSquare, label: "Send feedback", description: "Help us improve", type: "link" },
      ],
    },
  ];

  const handleToggle = (label: string) => {
    if (label === "Push notifications") setNotifications(v => !v);
    if (label === "Dark mode") setTheme(darkMode ? "light" : "dark");
    if (label === "Biometric login") setBiometric(v => !v);
  };

  const getToggleValue = (item: SettingItem) => {
    if (item.label === "Push notifications") return notifications;
    if (item.label === "Dark mode") return darkMode;
    if (item.label === "Biometric login") return biometric;
    return item.value as boolean;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile" className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {sections.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.06 }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">{section.title}</h2>
              <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => item.type === "toggle" ? handleToggle(item.label) : undefined}
                      className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                        )}
                      </div>
                      {item.type === "toggle" ? (
                        <div className={cn(
                          "w-11 h-6 rounded-full transition-colors relative shrink-0",
                          getToggleValue(item) ? "bg-foreground" : "bg-muted-foreground/30"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                            getToggleValue(item) ? "translate-x-[22px]" : "translate-x-0.5"
                          )} />
                        </div>
                      ) : item.type === "select" ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections.length * 0.06 }}
          >
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4 text-rose-600" />
                </div>
                <div className="flex-1 font-medium text-sm text-rose-600">Log out</div>
              </button>
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-rose-600">Delete account</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data</div>
                </div>
              </button>
            </div>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground pt-4">GlobeTrotter v1.0.0 · Made with ❤️ for travellers</p>
        </div>
      </div>

      <AnimatePresence>
        {isConfirmingDelete && (
          <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-card border border-border rounded-2xl shadow-modal max-w-sm w-full p-6"
            >
              <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h2 className="text-lg font-bold mb-1">Delete your account?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                This permanently deletes your profile, trips, wallet, and wishlists. This can't be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setIsConfirmingDelete(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => {
                    setIsConfirmingDelete(false);
                    signOut();
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

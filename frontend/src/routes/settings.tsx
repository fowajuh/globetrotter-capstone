import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Bell, Globe, Shield, CreditCard,
  Smartphone, Moon, HelpCircle, LogOut, Star, Languages, Eye,
  MessageSquare, Lock, Trash2, ChevronDown, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useBackendAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { usersApi } from "@/lib/api/users";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-store";
import { useNotificationPrefs } from "@/lib/notification-prefs-store";
import { useLocalePrefs, LANGUAGES, COUNTRIES } from "@/lib/locale-prefs-store";
import { PickerSheet } from "@/components/settings/PickerSheet";
import { RateAppSheet } from "@/components/settings/RateAppSheet";
import { FeedbackSheet } from "@/components/settings/FeedbackSheet";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const CURRENCIES = [
  { value: "USD", label: "USD – US Dollar", name: "US Dollar" },
  { value: "EUR", label: "EUR – Euro", name: "Euro" },
  { value: "GBP", label: "GBP – British Pound", name: "British Pound" },
  { value: "XAF", label: "XAF – Central African Franc", name: "Central African Franc" },
  { value: "NGN", label: "NGN – Nigerian Naira", name: "Nigerian Naira" },
];

type SettingItem = {
  icon: React.ElementType;
  label: string;
  description?: string;
  type: "link" | "toggle" | "select" | "action";
  value?: boolean | string;
  to?: string;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

function SettingsPage() {
  const { refreshToken, clear } = useBackendAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";
  const [biometric, setBiometric] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [openPicker, setOpenPicker] = useState<"language" | "currency" | "country" | null>(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const notifPrefs = useNotificationPrefs();
  const { language, country, setLanguage, setCountry } = useLocalePrefs();

  const meQuery = useQuery({ queryKey: ["me"], queryFn: usersApi.me, retry: false });
  const currency = meQuery.data?.homeCurrency ?? "USD";

  const updateCurrency = useMutation({
    mutationFn: (homeCurrency: string) => usersApi.updateMe({ homeCurrency }),
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      toast.success(`Currency set to ${user.homeCurrency}.`);
    },
    onError: () => toast.error("Couldn't update currency — try again."),
  });

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
        { icon: Globe, label: "Language", description: language, type: "select" },
        { icon: CreditCard, label: "Currency", description: `${currency} – ${CURRENCIES.find(c => c.value === currency)?.name ?? ""}`, type: "select" },
        { icon: Languages, label: "Country/region", description: country, type: "select" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon: Bell, label: "Trip updates", description: "Booking confirmations, check-in reminders", type: "toggle", value: notifPrefs.pushTripUpdates },
        { icon: MessageSquare, label: "Messages & calls", description: "New host messages and missed calls", type: "toggle", value: notifPrefs.pushMessages },
        { icon: Star, label: "Price drops", description: "When a wishlisted stay gets cheaper", type: "toggle", value: notifPrefs.pushPriceDrops },
        { icon: MessageSquare, label: "Booking receipts", description: "Email a receipt after every booking", type: "toggle", value: notifPrefs.emailBookingReceipts },
        { icon: MessageSquare, label: "Promotions", description: "Occasional offers and travel ideas", type: "toggle", value: notifPrefs.emailPromotions },
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
        { icon: HelpCircle, label: "Help Center", description: "Get answers to your questions", type: "link", to: "/help" },
        { icon: Star, label: "Rate the app", description: "Tell us what you think", type: "action" },
        { icon: MessageSquare, label: "Send feedback", description: "Help us improve", type: "action" },
      ],
    },
  ];

  const handleToggle = (label: string) => {
    if (label === "Dark mode") return setTheme(darkMode ? "light" : "dark");
    if (label === "Biometric login") return setBiometric(v => !v);
    if (label === "Trip updates") return notifPrefs.setPref("pushTripUpdates", !notifPrefs.pushTripUpdates);
    if (label === "Messages & calls") return notifPrefs.setPref("pushMessages", !notifPrefs.pushMessages);
    if (label === "Price drops") return notifPrefs.setPref("pushPriceDrops", !notifPrefs.pushPriceDrops);
    if (label === "Booking receipts") return notifPrefs.setPref("emailBookingReceipts", !notifPrefs.emailBookingReceipts);
    if (label === "Promotions") return notifPrefs.setPref("emailPromotions", !notifPrefs.emailPromotions);
  };

  const handleSelect = (label: string) => {
    if (label === "Language") setOpenPicker("language");
    if (label === "Currency") setOpenPicker("currency");
    if (label === "Country/region") setOpenPicker("country");
  };

  const handleAction = (label: string) => {
    if (label === "Rate the app") setRateOpen(true);
    if (label === "Send feedback") setFeedbackOpen(true);
  };

  const getToggleValue = (item: SettingItem) => item.value as boolean;

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
                  const body = (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</div>
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
                    </>
                  );

                  const className = "w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors text-left";

                  if (item.type === "link" && item.to) {
                    return (
                      <Link key={item.label} to={item.to} className={className}>
                        {body}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.type === "toggle") handleToggle(item.label);
                        if (item.type === "select") handleSelect(item.label);
                        if (item.type === "action") handleAction(item.label);
                      }}
                      className={className}
                    >
                      {body}
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

          <p className="text-center text-xs text-muted-foreground pt-4">GlobeTrotter v2.0.0 · Made with ❤️ for travellers</p>
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

      <PickerSheet
        open={openPicker === "language"}
        onClose={() => setOpenPicker(null)}
        title="Language"
        value={language}
        options={LANGUAGES.map((l) => ({ value: l, label: l }))}
        onSelect={setLanguage}
      />
      <PickerSheet
        open={openPicker === "currency"}
        onClose={() => setOpenPicker(null)}
        title="Currency"
        value={currency}
        options={CURRENCIES}
        onSelect={(v) => updateCurrency.mutate(v)}
      />
      <PickerSheet
        open={openPicker === "country"}
        onClose={() => setOpenPicker(null)}
        title="Country / region"
        value={country}
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
        onSelect={setCountry}
      />
      <RateAppSheet open={rateOpen} onClose={() => setRateOpen(false)} />
      <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useBackendAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { usersApi, type TravelStyle } from "@/lib/api/users";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, ChevronRight, Settings, CreditCard, Bell, HelpCircle, LogOut, Wallet, Backpack, Gem } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTravel } from "@/lib/travel-store";
import { useProfileBio } from "@/lib/profile-bio-store";
import { EditBioSheet } from "@/components/profile/EditBioSheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  component: ProfileScreen,
});

const TRAVEL_STYLES: { value: TravelStyle; label: string; icon: React.ElementType }[] = [
  { value: "shoestring", label: "Shoestring", icon: Backpack },
  { value: "comfort", label: "Comfort", icon: Wallet },
  { value: "luxury", label: "Luxury", icon: Gem },
];

function ProfileScreen() {
  const { name, email, refreshToken, clear } = useBackendAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "account">("profile");
  const { myTrips } = useTravel();
  const { bio, setBio } = useProfileBio();
  const [bioSheetOpen, setBioSheetOpen] = useState(false);
  const [draftName, setDraftName] = useState("");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: usersApi.me, retry: false });

  const updateProfile = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      toast.success("Profile updated.");
    },
    onError: () => toast.error("Couldn't save that change — try again."),
  });

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }, { unauthenticated: true });
      }
    } catch { /* best effort */ } finally {
      clear();
      navigate({ to: '/login' });
    }
  };

  // Derive display info from store
  const displayName = meQuery.data?.name || name || email?.split('@')[0] || 'Traveler';
  const firstName = displayName.split(' ')[0];
  const initials = displayName.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
  const travelStyle = meQuery.data?.travelStyle ?? null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="py-4 px-4 sm:px-6 flex justify-between items-center max-w-screen-md mx-auto">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-micro ${
              activeTab === "profile" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-micro ${
              activeTab === "account" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Account
          </button>
        </div>
      </div>

      <main className="max-w-screen-md mx-auto px-4 sm:px-6 mt-8">
        {activeTab === "profile" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Avatar Header */}
            <section className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-background shadow-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">{initials}</span>
                </div>
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-gray-100">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
              
              <div className="flex-1 mt-2">
                <h2 className="text-3xl font-bold mb-1">{displayName}</h2>
                <p className="text-muted-foreground">Joined in 2025</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="px-4 py-2 bg-muted rounded-xl border border-border shadow-sm flex flex-col">
                    <span className="text-lg font-bold">{myTrips.length}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Trips</span>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-xl border border-border shadow-sm flex flex-col">
                    <span className="text-lg font-bold">{new Set(myTrips.map(t => t.code.split(' · ')[1])).size}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Countries</span>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-xl border border-border shadow-sm flex flex-col">
                    <span className="text-lg font-bold">87k</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Miles</span>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* Identity Verification */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{firstName}'s confirmed information</h3>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-foreground">Identity</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-foreground">Email address</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-foreground">Phone number</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* About */}
            <section>
              <h3 className="font-bold text-xl mb-4">About {firstName}</h3>
              <p className="text-muted-foreground leading-relaxed">{bio}</p>
              <Button variant="outline" className="mt-4" onClick={() => setBioSheetOpen(true)}>Edit Intro</Button>
            </section>

          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Account Settings Menu */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <Link to="/settings" className="flex items-center justify-between p-4 border-b border-border hover:bg-muted transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="font-medium">Settings</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link to="/budget" className="flex items-center justify-between p-4 border-b border-border hover:bg-muted transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="font-medium">Payments & payouts</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link to="/settings" className="flex items-center justify-between p-4 border-b border-border hover:bg-muted transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="font-medium">Notifications</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link to="/help" className="flex items-center justify-between p-4 hover:bg-muted transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="font-medium">Help center</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>

            {/* Real account management: name + travel style, PATCH /users/me */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Display name</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    defaultValue={displayName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder={displayName}
                    className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground transition-colors"
                  />
                  <Button
                    size="sm"
                    disabled={!draftName.trim() || draftName.trim() === displayName || updateProfile.isPending}
                    onClick={() => updateProfile.mutate({ name: draftName.trim() })}
                  >
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Travel style</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {TRAVEL_STYLES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateProfile.mutate({ travelStyle: value })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors",
                        travelStyle === value ? "border-foreground bg-muted" : "border-border hover:border-foreground/40",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground pt-1 border-t border-border">
                Email: <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div className="pt-4 pb-8 flex justify-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 px-8 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
            
          </motion.div>
        )}
      </main>

      <EditBioSheet open={bioSheetOpen} onClose={() => setBioSheetOpen(false)} bio={bio} onSave={setBio} />
    </div>
  );
}

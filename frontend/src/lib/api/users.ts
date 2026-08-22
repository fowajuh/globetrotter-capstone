import { api } from "@/lib/api-client";

export type TravelStyle = "shoestring" | "comfort" | "luxury";

/** Mirrors UsersService.me() — see backend/src/modules/users/users.service.ts. */
export type BackendUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  travelStyle: TravelStyle | null;
  homeCurrency: string;
  createdAt: string;
};

export type UpdateProfileInput = Partial<{
  name: string;
  avatarUrl: string | null;
  travelStyle: TravelStyle;
  homeCurrency: string;
}>;

export type Plan = "explorer" | "voyager" | "crew";
export type BillingCycle = "monthly" | "annual";

export type Subscription = {
  plan: Plan;
  billingCycle: BillingCycle;
  status: "active" | "canceled";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string | null;
};

export const usersApi = {
  me: () => api.get<BackendUser>("/users/me"),
  updateMe: (patch: UpdateProfileInput) => api.patch<BackendUser>("/users/me", patch),
  getSubscription: () => api.get<Subscription>("/users/me/subscription"),
  updateSubscription: (plan: Plan, billingCycle: BillingCycle) =>
    api.patch<Subscription>("/users/me/subscription", { plan, billingCycle }),
  cancelSubscription: () => api.delete<Subscription>("/users/me/subscription"),
};

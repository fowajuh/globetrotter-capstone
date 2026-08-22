import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProfileBioState = {
  bio: string;
  setBio: (bio: string) => void;
};

const DEFAULT_BIO =
  "Avid traveler looking for unique experiences. I love exploring off-the-beaten-path locations, trying local cuisine, and meeting new people.";

/** The backend's User model has no bio column yet (see
 *  backend/src/modules/users/dto/update-profile.dto.ts), so this stays
 *  local — same honesty tradeoff as the wallet balance and payment cards. */
export const useProfileBio = create<ProfileBioState>()(
  persist((set) => ({ bio: DEFAULT_BIO, setBio: (bio) => set({ bio }) }), { name: "globetrotter-profile-bio" }),
);

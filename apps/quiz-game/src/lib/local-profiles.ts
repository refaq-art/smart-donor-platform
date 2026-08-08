'use client';

/**
 * ملفات لاعبين محليين محفوظة على هذا الجهاز (تمرير الجهاز / Local Multiplayer)
 * بحيث تتراكم إحصائياتهم عبر عدة مباريات بدل إنشاء لاعب جديد في كل مرة.
 */
const STORAGE_KEY = 'quiz_local_profiles';
const MAX_PROFILES = 20;

export interface LocalProfile {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
}

export function getLocalProfiles(): LocalProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalProfile(profile: LocalProfile) {
  const profiles = getLocalProfiles().filter((p) => p.playerId !== profile.playerId);
  profiles.unshift(profile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.slice(0, MAX_PROFILES)));
}

export function removeLocalProfile(playerId: string) {
  const profiles = getLocalProfiles().filter((p) => p.playerId !== playerId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the display name for a Clerk user
 * Priority: unsafeMetadata.displayName > fullName > firstName > empty string
 */
export function getUserDisplayName(user: {
  unsafeMetadata?: { displayName?: string };
  fullName?: string | null;
  firstName?: string | null;
} | null | undefined): string {
  if (!user) return "";
  
  // First check if user has manually set a display name
  if (user.unsafeMetadata?.displayName) {
    return user.unsafeMetadata.displayName;
  }
  
  // Then use fullName (includes firstName + lastName from OAuth)
  if (user.fullName) {
    return user.fullName;
  }
  
  // Fall back to firstName
  if (user.firstName) {
    return user.firstName;
  }
  
  return "";
}

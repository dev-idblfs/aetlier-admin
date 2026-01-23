/**
 * PreferencesContext - Manages user preferences (theme, layout, notifications)
 * Syncs with backend and applies preferences to the UI
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import { api } from "@/redux/services/api";

const PreferencesContext = createContext(null);

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES = {
  // Theme
  dark_mode: false,
  compact_view: false,
  show_animations: true,

  // Notifications
  email_notifications: true,
  appointment_reminders: true,
  marketing_emails: true,
  sms_notifications: true,

  // Security
  two_factor_enabled: false,
};

/**
 * PreferencesProvider Component
 * Fetches user preferences and applies them to the application
 */
export const PreferencesProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // RTK Query hooks
  const [fetchPreferences] = api.endpoints.getUserPreferences.useLazyQuery();
  const [updatePreferences] = api.endpoints.updateUserPreferences.useMutation();

  /**
   * Load user preferences from backend
   */
  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoading(false);
      return;
    }

    try {
      const result = await fetchPreferences(user.id).unwrap();
      if (result) {
        setPreferences({
          dark_mode: result.dark_mode ?? DEFAULT_PREFERENCES.dark_mode,
          compact_view: result.compact_view ?? DEFAULT_PREFERENCES.compact_view,
          show_animations:
            result.show_animations ?? DEFAULT_PREFERENCES.show_animations,
          email_notifications:
            result.email_notifications ??
            DEFAULT_PREFERENCES.email_notifications,
          appointment_reminders:
            result.appointment_reminders ??
            DEFAULT_PREFERENCES.appointment_reminders,
          marketing_emails:
            result.marketing_emails ?? DEFAULT_PREFERENCES.marketing_emails,
          sms_notifications:
            result.sms_notifications ?? DEFAULT_PREFERENCES.sms_notifications,
          two_factor_enabled:
            result.two_factor_enabled ?? DEFAULT_PREFERENCES.two_factor_enabled,
        });
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchPreferences]);

  /**
   * Load preferences on mount and when user changes
   */
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  /**
   * Apply theme preference to document
   */
  useEffect(() => {
    if (preferences.dark_mode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [preferences.dark_mode]);

  /**
   * Apply compact view preference to body
   */
  useEffect(() => {
    if (preferences.compact_view) {
      document.body.classList.add("compact-view");
    } else {
      document.body.classList.remove("compact-view");
    }
  }, [preferences.compact_view]);

  /**
   * Apply animations preference
   */
  useEffect(() => {
    if (!preferences.show_animations) {
      document.body.classList.add("no-animations");
    } else {
      document.body.classList.remove("no-animations");
    }
  }, [preferences.show_animations]);

  /**
   * Update a specific preference
   */
  const updatePreference = useCallback(
    async (key, value) => {
      if (!user?.id) {
        console.error("No user ID available");
        return;
      }

      // Optimistic update
      setPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));

      try {
        await updatePreferences({
          userId: user.id,
          preferences: { [key]: value },
        }).unwrap();
      } catch (error) {
        console.error("Failed to update preference:", error);
        // Revert on error
        await loadPreferences();
      }
    },
    [user?.id, updatePreferences, loadPreferences],
  );

  /**
   * Update multiple preferences at once
   */
  const updateMultiplePreferences = useCallback(
    async (updates) => {
      if (!user?.id) {
        console.error("No user ID available");
        return;
      }

      // Optimistic update
      setPreferences((prev) => ({
        ...prev,
        ...updates,
      }));

      try {
        await updatePreferences({
          userId: user.id,
          preferences: updates,
        }).unwrap();
      } catch (error) {
        console.error("Failed to update preferences:", error);
        // Revert on error
        await loadPreferences();
      }
    },
    [user?.id, updatePreferences, loadPreferences],
  );

  /**
   * Toggle dark mode
   */
  const toggleDarkMode = useCallback(() => {
    updatePreference("dark_mode", !preferences.dark_mode);
  }, [preferences.dark_mode, updatePreference]);

  /**
   * Toggle compact view
   */
  const toggleCompactView = useCallback(() => {
    updatePreference("compact_view", !preferences.compact_view);
  }, [preferences.compact_view, updatePreference]);

  /**
   * Toggle animations
   */
  const toggleAnimations = useCallback(() => {
    updatePreference("show_animations", !preferences.show_animations);
  }, [preferences.show_animations, updatePreference]);

  const value = {
    preferences,
    isLoading,
    updatePreference,
    updateMultiplePreferences,
    toggleDarkMode,
    toggleCompactView,
    toggleAnimations,
    reload: loadPreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

/**
 * Hook to use preferences context
 */
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};

export default PreferencesContext;

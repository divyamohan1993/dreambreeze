/**
 * DataVault -- user's data control center for DreamBreeze.
 *
 * Implements data principal rights under:
 * - DPDP Act 2023 (India): Section 12 (right to data portability), Section 13 (right to erasure)
 * - GDPR (EU): Article 20 (portability), Article 17 (right to erasure)
 * - CCPA (California): Right to know, right to delete
 *
 * Data retention policy: auto-delete sessions older than 365 days.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// -- Types ----------------------------------------------------------------------

export interface DataSummary {
  profile: {
    exists: boolean;
    createdAt: string | null;
  };
  sleepSessions: {
    count: number;
    oldestDate: string | null;
    newestDate: string | null;
    totalDurationHours: number;
  };
  sleepEvents: {
    count: number;
  };
  fanConfigs: {
    count: number;
  };
  consentLog: {
    count: number;
  };
  localData: {
    consentRecords: boolean;
    uiPreferences: boolean;
    calibrationData: boolean;
  };
  retentionPolicy: string;
}

export interface ExportedData {
  exportDate: string;
  exportVersion: string;
  profile: Record<string, unknown> | null;
  sleepSessions: Record<string, unknown>[];
  sleepEvents: Record<string, unknown>[];
  fanConfigs: Record<string, unknown>[];
  consentLog: Record<string, unknown>[];
  localPreferences: Record<string, unknown>;
}

// -- Constants ------------------------------------------------------------------

const RETENTION_DAYS = 365;
const EXPORT_VERSION = '1.0.0';

const LOCAL_STORAGE_KEYS = [
  'dreambreeze-consent',
  'dreambreeze-consent-log',
  'dreambreeze-ui',
];

// -- DataVault Class ------------------------------------------------------------

export class DataVault {
  private _supabase: SupabaseClient | null;
  private _userId: string | null;

  constructor(supabase: SupabaseClient | null, userId: string | null) {
    this._supabase = supabase;
    this._userId = userId;
  }

  /**
   * Export ALL user data as a JSON object.
   *
   * Compliant with DPDP Section 12 and GDPR Article 20 (right to data portability).
   * Returns data in a machine-readable, structured format.
   */
  async exportAllData(): Promise<ExportedData> {
    const exportData: ExportedData = {
      exportDate: new Date().toISOString(),
      exportVersion: EXPORT_VERSION,
      profile: null,
      sleepSessions: [],
      sleepEvents: [],
      fanConfigs: [],
      consentLog: [],
      localPreferences: this._exportLocalData(),
    };

    if (!this._supabase || !this._userId) {
      return exportData;
    }

    // Profile
    const { data: profile } = await this._supabase
      .from('profiles')
      .select('*')
      .eq('id', this._userId)
      .single();
    exportData.profile = profile;

    // Sleep sessions
    const { data: sessions } = await this._supabase
      .from('sleep_sessions')
      .select('*')
      .eq('user_id', this._userId)
      .order('start_time', { ascending: false });
    exportData.sleepSessions = sessions ?? [];

    // Sleep events
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s: Record<string, unknown>) => s.id);
      const { data: events } = await this._supabase
        .from('sleep_events')
        .select('*')
        .in('session_id', sessionIds)
        .order('timestamp', { ascending: true });
      exportData.sleepEvents = events ?? [];
    }

    // Fan configs
    const { data: fanConfigs } = await this._supabase
      .from('fan_configs')
      .select('*')
      .eq('user_id', this._userId);
    exportData.fanConfigs = fanConfigs ?? [];

    // Consent log
    const { data: consentLog } = await this._supabase
      .from('consent_log')
      .select('*')
      .eq('user_id', this._userId)
      .order('timestamp', { ascending: true });
    exportData.consentLog = consentLog ?? [];

    return exportData;
  }

  /**
   * Delete ALL user data -- the nuclear option.
   *
   * Compliant with DPDP Section 13 and GDPR Article 17 (right to erasure).
   * Removes data from Supabase and local storage.
   *
   * Order: events -> sessions -> fan configs -> consent log -> profile -> local
   */
  async deleteAllData(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Delete cloud data
    if (this._supabase && this._userId) {
      // 1. Get session IDs first
      const { data: sessions } = await this._supabase
        .from('sleep_sessions')
        .select('id')
        .eq('user_id', this._userId);

      // 2. Delete sleep events
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s: { id: string }) => s.id);
        const { error: eventsErr } = await this._supabase
          .from('sleep_events')
          .delete()
          .in('session_id', sessionIds);
        if (eventsErr) errors.push(`Sleep events: ${eventsErr.message}`);
      }

      // 3. Delete sleep sessions
      const { error: sessionsErr } = await this._supabase
        .from('sleep_sessions')
        .delete()
        .eq('user_id', this._userId);
      if (sessionsErr) errors.push(`Sleep sessions: ${sessionsErr.message}`);

      // 4. Delete fan configs
      const { error: fansErr } = await this._supabase
        .from('fan_configs')
        .delete()
        .eq('user_id', this._userId);
      if (fansErr) errors.push(`Fan configs: ${fansErr.message}`);

      // 5. Delete consent log
      const { error: consentErr } = await this._supabase
        .from('consent_log')
        .delete()
        .eq('user_id', this._userId);
      if (consentErr) errors.push(`Consent log: ${consentErr.message}`);

      // 6. Delete profile (last, as other tables reference it)
      const { error: profileErr } = await this._supabase
        .from('profiles')
        .delete()
        .eq('id', this._userId);
      if (profileErr) errors.push(`Profile: ${profileErr.message}`);
    }

    // Delete local data
    this._deleteLocalData();

    return { success: errors.length === 0, errors };
  }

  /**
   * Get a summary of what data we hold about the user.
   *
   * Supports DPDP Section 11 (right to information) and CCPA (right to know).
   */
  async getDataSummary(): Promise<DataSummary> {
    const summary: DataSummary = {
      profile: { exists: false, createdAt: null },
      sleepSessions: { count: 0, oldestDate: null, newestDate: null, totalDurationHours: 0 },
      sleepEvents: { count: 0 },
      fanConfigs: { count: 0 },
      consentLog: { count: 0 },
      localData: {
        consentRecords: typeof window !== 'undefined' && localStorage.getItem('dreambreeze-consent') !== null,
        uiPreferences: typeof window !== 'undefined' && localStorage.getItem('dreambreeze-ui') !== null,
        calibrationData: false,
      },
      retentionPolicy: `Sleep session data is automatically deleted after ${RETENTION_DAYS} days. You can delete all data at any time.`,
    };

    if (!this._supabase || !this._userId) {
      return summary;
    }

    // Profile
    const { data: profile } = await this._supabase
      .from('profiles')
      .select('created_at')
      .eq('id', this._userId)
      .single();
    if (profile) {
      summary.profile.exists = true;
      summary.profile.createdAt = profile.created_at;
    }

    // Sleep sessions count + dates
    const { data: sessions, count: sessionCount } = await this._supabase
      .from('sleep_sessions')
      .select('start_time, total_duration_min', { count: 'exact' })
      .eq('user_id', this._userId)
      .order('start_time', { ascending: true });
    if (sessions && sessions.length > 0) {
      summary.sleepSessions.count = sessionCount ?? sessions.length;
      summary.sleepSessions.oldestDate = sessions[0].start_time;
      summary.sleepSessions.newestDate = sessions[sessions.length - 1].start_time;
      summary.sleepSessions.totalDurationHours = Math.round(
        sessions.reduce((sum: number, s: { total_duration_min: number }) => sum + (s.total_duration_min ?? 0), 0) / 60,
      );
    }

    // Sleep events count
    const { count: eventsCount } = await this._supabase
      .from('sleep_events')
      .select('id', { count: 'exact', head: true })
      .in(
        'session_id',
        (sessions ?? []).map((s: { start_time: string }) => s.start_time),
      );
    summary.sleepEvents.count = eventsCount ?? 0;

    // Fan configs count
    const { count: fansCount } = await this._supabase
      .from('fan_configs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', this._userId);
    summary.fanConfigs.count = fansCount ?? 0;

    // Consent log count
    const { count: consentCount } = await this._supabase
      .from('consent_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', this._userId);
    summary.consentLog.count = consentCount ?? 0;

    return summary;
  }

  /**
   * Enforce data retention policy: delete sessions older than RETENTION_DAYS.
   */
  async enforceRetentionPolicy(): Promise<number> {
    if (!this._supabase || !this._userId) return 0;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    const cutoffIso = cutoff.toISOString();

    // Find old sessions
    const { data: oldSessions } = await this._supabase
      .from('sleep_sessions')
      .select('id')
      .eq('user_id', this._userId)
      .lt('start_time', cutoffIso);

    if (!oldSessions || oldSessions.length === 0) return 0;

    const sessionIds = oldSessions.map((s: { id: string }) => s.id);

    // Delete events for old sessions
    await this._supabase.from('sleep_events').delete().in('session_id', sessionIds);

    // Delete old sessions
    await this._supabase
      .from('sleep_sessions')
      .delete()
      .eq('user_id', this._userId)
      .lt('start_time', cutoffIso);

    return oldSessions.length;
  }

  // -- Private ---------------------------------------------------------------

  private _exportLocalData(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};

    const data: Record<string, unknown> = {};
    for (const key of LOCAL_STORAGE_KEYS) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    }
    return data;
  }

  private _deleteLocalData(): void {
    if (typeof window === 'undefined') return;

    for (const key of LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }
}

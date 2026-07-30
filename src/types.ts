export type ContentCategory = 
  | 'BRANDING' 
  | 'OVERLAY';

export type PlatformType = 
  | 'INSTAGRAM' 
  | 'TIKTOK' 
  | 'FANSPAGE FB' 
  | 'FACEBOOK PRO';

export type PostStatus = 'Dipublikasikan' | 'Ditangguhkan';

export interface DocumentEntry {
  id: string;
  timestamp: string;
  
  // Direct Google Sheet Columns (Columns A-G)
  konten: string;           // Col A: Konten (e.g. BRANDING)
  platform: string;         // Col B: PLATFORM (e.g. INSTAGRAM)
  idReff: string;           // Col C: ID REFF (e.g. miya0812)
  status: string;           // Col D: Status (e.g. Dipublikasikan)
  tanggalPostingan: string; // Col E: Tanggal postingan (e.g. 26/07/2026)
  linkKonten: string;       // Col F: LINK KONTEN (e.g. https://instagram.com/...)
  catatan: string;          // Col G: CATATAN
  website?: string;         // Website / Tab name (e.g. studiobet78, bigbet78, piala45, bambu189)

  // UI Compatibility & System Metadata
  title?: string;
  category?: string;
  refNumber?: string;
  submitter?: string;
  recipient?: string;
  amount?: number;
  priority?: string;
  docDate?: string;
  notes?: string;
  attachmentUrl?: string;
  notificationEmail?: string;
  emailSent?: boolean;
  syncedToSheet?: boolean;
  syncedViaAppsScript?: boolean;
  sheetRow?: number;
}

export interface AppSettings {
  spreadsheetId: string;
  sheetName: string;
  appsScriptUrl: string;
  defaultNotificationEmail: string;
  enableAutoEmail: boolean;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  autoSyncToSheet: boolean;
  senderName: string;
}

export interface DailyStat {
  date: string;
  formattedDate: string;
  count: number;
  publishedCount: number;
  pendingCount: number;
}

export interface DistributionStat {
  name: string;
  count: number;
  percentage: number;
}

export interface DashboardSummary {
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  totalAllTime: number;
  publishedRate: number;
  pendingCount: number;
  publishedCount: number;
  dailyStats: DailyStat[];
  platformStats: DistributionStat[];
  contentTypeStats: DistributionStat[];
  topAccounts: DistributionStat[];
}

export interface FormSubmissionPayload {
  konten: string;
  platform: string;
  idReff: string;
  status: string;
  tanggalPostingan: string;
  linkKonten: string;
  catatan: string;
  website?: string;
  notificationEmail?: string;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  entry?: DocumentEntry;
  sheetRow?: number;
  emailSent?: boolean;
  error?: string;
  errors?: {
    sheetError?: string;
    emailError?: string;
  };
}


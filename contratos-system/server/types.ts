import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    pendingAnalysis?: {
      text: string;
      metadata: any;
      contractType: string;
      sensitiveData: any[];
    };
  }
}
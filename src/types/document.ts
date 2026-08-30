export type DocumentType =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "proof_of_address"
  | "business_registration"
  | "dni";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "verified"
  | "rejected"
  | "manual_review";

export interface DocumentRequest {
  applicationId: number;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileHash: string;
}

export interface DocumentVerification {
  verified: boolean;
  status: DocumentStatus;
  reasons: string[];
  externalId?: string;
  extractedData: Record<string, unknown>;
}

export interface DocumentRecord {
  id: number;
  applicationId: number;
  provider: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileHash: string;
  status: DocumentStatus;
  extractedData: Record<string, unknown>;
  externalId: string | null;
  createdAt: Date;
}
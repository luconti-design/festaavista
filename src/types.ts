export type RawQuote = Record<string, string>;
export interface Quote { raw: RawQuote; id: number; name: string; price: number | null; guests: number | null; year: string }
export interface House { key: string; best: Quote; quotes: Quote[]; requestedYear: string; isHistorical: boolean }
export type Period = 'weekday' | 'friday' | 'weekend';
export interface Filters {city: string; guests: string; year: string; period: Period | ''; district: string; sort: 'asc' | 'desc'; venue: string; min: string; max: string}
export interface QuotesResponse {rows: RawQuote[]; fetchedAt: string; stale: boolean; warning?: string}
export interface Ticket {token: string; issued: number; expires: number; signature: string}
export interface Attachment {name: string; type: string; uploadId: string}
export interface ManualOption {guests: string; price: string}
export interface Contribution {type: 'documents' | 'manual'; ticket: Ticket; files: Attachment[]; truth: boolean; consent: boolean; options?: ManualOption[]; [field: string]: unknown}
export interface Confirmation {ok: boolean; message: string}
export interface UploadChunk {ticket: Ticket; slot: number; name: string; type: string; size: number; index: number; total: number; data: string}
export interface UploadResult {uploadId?: string; received: number}
export interface Api {
  getQuotes(): Promise<QuotesResponse>;
  beginContribution(): Promise<Ticket>;
  uploadContributionChunk(chunk: UploadChunk): Promise<UploadResult>;
  submitContribution(data: Contribution): Promise<Confirmation>;
}

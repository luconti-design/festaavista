import type { Api, UploadResult, Confirmation, QuotesResponse, Ticket } from '../types';
interface Runner { withSuccessHandler(fn: (data: unknown)=>void): Runner; withFailureHandler(fn: (error: {message?:string})=>void): Runner; [method: string]: unknown }
declare global {interface Window {google?: {script?: {run?: Runner}}}}
export const hasGoogleScript = () => !!window.google?.script?.run;
export function rpc<T>(method: string, payload?: unknown): Promise<T> {
  return new Promise((resolve,reject)=>{
    const run=window.google?.script?.run;
    if(!run){reject(new Error('Abra o endereço /exec do Apps Script.'));return;}
    const runner=run.withSuccessHandler(data=>resolve(data as T)).withFailureHandler(error=>reject(new Error(error.message||'O serviço Google não concluiu a operação.')));
    const call=runner[method];
    if(typeof call!=='function'){reject(new Error('Serviço indisponível.'));return;}
    // No artificial timeout for writes: a timed-out browser promise could hide a committed upload.
    if(payload===undefined)call.call(runner);else call.call(runner,payload);
  });
}
export const googleApi: Api = {
  getQuotes:()=>rpc<QuotesResponse>('getQuotes'),beginContribution:()=>rpc<Ticket>('beginContribution'),
  uploadContributionChunk:p=>rpc<UploadResult>('uploadContributionChunk',p),submitContribution:p=>rpc<Confirmation>('submitContribution',p),
};

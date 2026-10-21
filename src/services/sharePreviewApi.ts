import type {Api,QuotesResponse} from '../types';
export const SHARE_PREVIEW_MESSAGE='Prévia para avaliação: cópia dos dados públicos da planilha, sem atualização automática. Envios desativados.';
const blocked=async():Promise<never>=>{throw new Error('Esta prévia permite avaliar o formulário, mas não recebe cotações nem arquivos.');};
export const sharePreviewApi:Api={
 getQuotes:async()=>{
  const response=await fetch('./preview-data.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Não foi possível carregar os dados desta prévia.');
  const data=await response.json() as QuotesResponse;
  if(!Array.isArray(data.rows)||!data.rows.length||!Number.isFinite(Date.parse(data.fetchedAt)))throw new Error('Os dados da prévia estão inválidos.');
  return {...data,stale:false,warning:SHARE_PREVIEW_MESSAGE};
 },
 beginContribution:blocked,uploadContributionChunk:blocked,submitContribution:blocked,
};

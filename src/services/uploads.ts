import type { Api, Attachment, Ticket } from '../types';
export const MAX_FILE_BYTES=10*1024*1024;
export const CHUNK_BYTES=256*1024;
export function validateFiles(files: File[]) {
  if(files.length<1||files.length>3)throw new Error('Envie de 1 a 3 arquivos.');
  const types: Record<string,RegExp>={'application/pdf':/\.pdf$/i,'image/jpeg':/\.jpe?g$/i,'image/png':/\.png$/i};
  if(files.some(f=>!f.size||f.size>MAX_FILE_BYTES||!types[f.type]?.test(f.name)))throw new Error('Envie PDF, JPG ou PNG de até 10 MB por arquivo.');
}
const base64 = (blob: Blob):Promise<string> => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Falha ao ler o arquivo.'));reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.readAsDataURL(blob);});
export async function uploadFiles(api: Api,ticket: Ticket,files: File[],progress:(text:string)=>void):Promise<Attachment[]> {
  validateFiles(files);const attachments:Attachment[]=[];
  // Sequential chunks avoid a single 40 MiB RPC and stay below concurrent-call limits.
  for(const [slot,file] of files.entries()) {
    const total=Math.ceil(file.size/CHUNK_BYTES);let uploadId: string|undefined;
    for(let index=0;index<total;index++){
      if(Date.now()>=ticket.expires)throw new Error('A sessão expirou. Reabra o formulário para reenviar.');
      progress(`Arquivo ${slot+1} de ${files.length} · ${Math.round(index/total*100)}%`);
      const data=await base64(file.slice(index*CHUNK_BYTES,(index+1)*CHUNK_BYTES));
      const result=await api.uploadContributionChunk({ticket,slot,name:file.name,type:file.type,size:file.size,index,total,data});
      if(result.received!==index+1)throw new Error('Parte do arquivo não foi confirmada. Tente enviar novamente.');
      uploadId=result.uploadId||uploadId;
    }
    if(!uploadId)throw new Error('O arquivo não foi finalizado. Tente novamente.');
    attachments.push({name:file.name,type:file.type,uploadId});
  }
  return attachments;
}

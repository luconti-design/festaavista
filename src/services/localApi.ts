import type { Api, RawQuote } from '../types';
export function parseCsv(csv: string): RawQuote[] {
  let rows: string[][]=[], row: string[]=[], value='',quoted=false;
  for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}else value+=c;}
  if(quoted)throw new Error('CSV inválido.');if(value||row.length){row.push(value);rows.push(row);}
  const head=rows.shift()?.map(h=>h.replace(/^\uFEFF/,'').trim());
  if(!head||!['Nome da casa','Cidade','Valor'].every(k=>head.includes(k))||!rows.length||rows.some(r=>r.length!==head.length))throw new Error('CSV inválido ou vazio.');
  return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]])));
}
export function createLocalApi(mock: boolean): Api {
  const blocked=async()=>{throw new Error('Envios reais são feitos somente na implantação Apps Script. Use VITE_DATA_MODE=mock para testar o fluxo local sem gravar dados.');};
  return {
    getQuotes:async()=>{
      const rows=mock?(await import('../mocks/quotes')).mockQuotes:await fetch('/official-csv',{cache:'no-store',signal:AbortSignal.timeout(45000)}).then(async r=>{if(!r.ok)throw new Error('Falha na consulta do CSV oficial.');return parseCsv(await r.text());});
      return {rows,fetchedAt:new Date().toISOString(),stale:false};
    },
    beginContribution:mock?async()=>({token:crypto.randomUUID(),issued:Date.now()-3000,expires:Date.now()+1800000,signature:'LOCAL-MOCK'}):blocked,
    uploadContributionChunk:mock?async p=>({received:p.index+1,...(p.index===p.total-1?{uploadId:'mock-'+p.slot}:{})}):blocked,
    submitContribution:mock?async()=>({ok:true,message:'SIMULAÇÃO LOCAL: nenhum arquivo ou cotação foi enviado ao Google.'}):blocked,
  };
}

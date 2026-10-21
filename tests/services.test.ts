import {expect,test,vi} from 'vitest';
import {googleApi,rpc} from '../src/services/googleScript';
import {CHUNK_BYTES,uploadFiles,validateFiles} from '../src/services/uploads';
import {selectHouse} from '../src/services/domain';
import {parseCsv} from '../src/services/localApi';
import type {Api,UploadChunk} from '../src/types';
test('RPC adapters resolve and reject callback errors',async()=>{
 let success:(v:unknown)=>void=()=>{},failure:(v:{message:string})=>void=()=>{};
 const runner={withSuccessHandler:vi.fn(fn=>{success=fn;return runner;}),withFailureHandler:vi.fn(fn=>{failure=fn;return runner;}),getQuotes:vi.fn(()=>success({rows:[]})),beginContribution:vi.fn(()=>failure({message:'Indisponível'}))};
 window.google={script:{run:runner}};
 expect(await googleApi.getQuotes()).toEqual({rows:[]});await expect(googleApi.beginContribution()).rejects.toThrow('Indisponível');
 delete window.google;await expect(rpc('getQuotes')).rejects.toThrow('/exec');
});
test('file transfer uses sequential bounded chunks and only references in result',async()=>{
 const chunks:UploadChunk[]=[],active={count:0,max:0};
 const api={uploadContributionChunk:async(p:UploadChunk)=>{active.count++;active.max=Math.max(active.max,active.count);chunks.push(p);await Promise.resolve();active.count--;return {received:p.index+1,...(p.index===p.total-1?{uploadId:'private-id'}:{})};}} as Api;
 const file=new File([new Uint8Array(CHUNK_BYTES+10)],'a.pdf',{type:'application/pdf'});
 const result=await uploadFiles(api,{token:'x',issued:0,expires:Date.now()+100000,signature:'x'},[file],()=>{});
 expect(chunks).toHaveLength(2);expect(active.max).toBe(1);expect(chunks[0].data.length).toBeLessThan(350000);expect(result).toEqual([{name:'a.pdf',type:'application/pdf',uploadId:'private-id'}]);
});
test('oversize, invalid type, count and missing final receipt fail',async()=>{
 expect(()=>validateFiles([new File(['x'],'x.exe',{type:'application/pdf'})])).toThrow();
 expect(()=>validateFiles(Array.from({length:4},()=>new File(['x'],'x.pdf',{type:'application/pdf'})))).toThrow();
 expect(()=>validateFiles([new File([new Uint8Array(10*1024*1024+1)],'x.pdf',{type:'application/pdf'})])).toThrow();
 const api={uploadContributionChunk:async()=>({received:1})} as unknown as Api;
 await expect(uploadFiles(api,{token:'x',issued:0,expires:Date.now()+100000,signature:'x'},[new File(['x'],'x.pdf',{type:'application/pdf'})],()=>{})).rejects.toThrow('finalizado');
});
test('a fifth slot and duplicate key cannot be added',()=>{const slots=['a','b','c','d'];expect(selectHouse(slots,4,'e')).toEqual(slots);expect(selectHouse(slots,1,'a')).toEqual(slots);});
test('development CSV parser retains quoted commas and rejects truncated CSV',()=>{const csv='Nome da casa,Cidade,Valor\r\n"Casa, A",Niterói,"R$ 8.000,00"';expect(parseCsv(csv)[0]['Nome da casa']).toBe('Casa, A');expect(()=>parseCsv(csv+'"')).toThrow();});

import {useEffect,useRef,useState} from 'react';
import type {Api,Contribution,ManualOption,Ticket} from '../types';
import {uploadFiles} from '../services/uploads';
export function useContribution(api:Promise<Api>){
 const ticket=useRef<Ticket|null>(null),busy=useRef(false),pending=useRef<Contribution|null>(null);
 const [sending,setSending]=useState(false),[status,setStatus]=useState(''),[done,setDone]=useState(false);
 useEffect(()=>{let active=true;void api.then(a=>a.beginContribution()).then(t=>{if(active)ticket.current=t;}).catch(e=>{if(active)setStatus(e.message);});return()=>{active=false;};},[api]);
 async function submit(form:HTMLFormElement,type:'manual'|'documents',files:File[],options?:ManualOption[]){
  if(busy.current)return;
  // Capture while inputs are enabled. After setSending/await, the disabled fieldset
  // is correctly omitted by FormData, so reading it later would lose common fields.
  const draft=pending.current?null:{data:Object.fromEntries([...new FormData(form)].filter((entry):entry is [string,string]=>typeof entry[1]==='string')),truth:(form.elements.namedItem('truth') as HTMLInputElement).checked,consent:(form.elements.namedItem('consent') as HTMLInputElement).checked,options:options?.map(option=>({...option}))};
  busy.current=true;setSending(true);setStatus('Preparando sua contribuição…');
  try{
   const a=await api;
   if(!pending.current&&draft){
    if(!ticket.current||ticket.current.expires<=Date.now()){ticket.current=await a.beginContribution();setStatus('Sessão renovada. Confira os dados e clique em enviar novamente.');return;}
    const attachment=type==='documents'?await uploadFiles(a,ticket.current,files,setStatus):[];
    pending.current={...draft.data,type,ticket:ticket.current,truth:draft.truth,consent:draft.consent,files:attachment,...(type==='manual'?{options:draft.options}:{})};
   }
   setStatus('Registrando para conferência…');
   if(!pending.current)throw new Error('Não foi possível preparar os dados do envio.');
   const result=await a.submitContribution(pending.current);setStatus(result.message);setDone(true);ticket.current=null;pending.current=null;
  }catch(e){setStatus((e instanceof Error?e.message:'Falha no envio.')+(pending.current?' Tente novamente para confirmar o mesmo envio, sem duplicá-lo.':''));}
  finally{busy.current=false;setSending(false);}
 }
 return {sending,status,done,submit,hasPending:!!pending.current};
}

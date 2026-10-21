import {useCallback,useEffect,useRef,useState} from 'react';
import type {Api,QuotesResponse} from '../types';
export function useQuotes(api: Promise<Api>) {
  const [data,setData]=useState<QuotesResponse|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const busy=useRef(false),mounted=useRef(true);
  const reload=useCallback(async()=>{
    if(busy.current)return;busy.current=true;
    try {const next=await (await api).getQuotes();if(mounted.current){setData(next);setError('');}}
    catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Não foi possível carregar a base.');}
    finally{busy.current=false;if(mounted.current)setLoading(false);}
  },[api]);
  useEffect(()=>{mounted.current=true;void reload();const timer=setInterval(()=>{if(!document.hidden)void reload();},300000);const visible=()=>{if(!document.hidden)void reload();};document.addEventListener('visibilitychange',visible);return()=>{mounted.current=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[reload]);
  return {data,error,loading,reload};
}

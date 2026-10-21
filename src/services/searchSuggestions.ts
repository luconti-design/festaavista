import type {Filters,House,Period,Quote} from '../types';
import {norm,search} from './domain';
export function searchSuggestions(records:Quote[],filters:Filters,current:House[]){
 if(!filters.city||!filters.guests||!filters.year||!filters.period)return [];
 const keys=new Set(current.map(h=>h.key));
 const years=[...new Set([filters.year,...records.filter(q=>norm(q.raw.Cidade)===norm(filters.city)&&q.guests===Number(filters.guests)&&/^\d{4}$/.test(q.year)).map(q=>q.year)])];
 const candidates=years.flatMap(year=>(['weekday','friday','weekend'] as Period[]).flatMap(period=>{
  if(year===filters.year&&period===filters.period)return [];
  const results=search(records,{...filters,year,period}),added=results.filter(h=>!keys.has(h.key));
  return added.length?[{year,period,added:added.length,total:results.length,newKeys:added.map(h=>h.key).sort().join('\n')}]:[];
 }));
 candidates.sort((a,b)=>(Number(a.year!==filters.year)+Number(a.period!==filters.period))-(Number(b.year!==filters.year)+Number(b.period!==filters.period))||Number(a.period!==filters.period)-Number(b.period!==filters.period)||b.added-a.added||Math.abs(Number(a.year)-Number(filters.year))-Math.abs(Number(b.year)-Number(filters.year))||a.year.localeCompare(b.year));
 const seen=new Set<string>();
 return candidates.filter(c=>{if(seen.has(c.newKeys))return false;seen.add(c.newKeys);return true;}).slice(0,2);
}

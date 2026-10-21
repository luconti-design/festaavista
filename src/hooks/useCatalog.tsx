import {createContext,useContext,useMemo,useState,type ReactNode} from 'react';
import type {Api,Filters,House,Quote} from '../types';
import {createApi} from '../services/api';
import {prepare,search} from '../services/domain';
import {useQuotes} from './useQuotes';
const initial:Filters={city:'',guests:'',year:'',period:'',district:'',sort:'asc',venue:'',min:'',max:''};
interface Catalog extends ReturnType<typeof useQuotes> {api:Promise<Api>;records:Quote[];houses:House[];filters:Filters;setFilters:(f:Filters)=>void;slots:(string|null)[];setSlots:(slots:(string|null)[])=>void;comparisonColumns:number;setComparisonColumns:(count:number)=>void;removeSlot:(index:number)=>void}
const Context=createContext<Catalog|null>(null);
export function CatalogProvider({children}:{children:ReactNode}){
  const [api]=useState(createApi),quotes=useQuotes(api),[filters,setFilterState]=useState<Filters>(()=>{try{const saved=JSON.parse(localStorage.getItem('festa-search-v1')||'null');return saved&&typeof saved.city==='string'&&saved.city&&/^\d+$/.test(saved.guests)&&/^\d{4}$/.test(saved.year)&&['weekday','friday','weekend'].includes(saved.period)?{...initial,city:saved.city,guests:String(saved.guests),year:String(saved.year),period:saved.period}:initial;}catch{return initial;}}),[stored,setSlots]=useState<(string|null)[]>([null,null,null,null]);
  const setFilters=(next:Filters)=>{setFilterState(next);try{if(next.city&&next.guests&&next.year&&next.period)localStorage.setItem('festa-search-v1',JSON.stringify({city:next.city,guests:next.guests,year:next.year,period:next.period}));else localStorage.removeItem('festa-search-v1');}catch{/* Search works without storage. */}};
  const records=useMemo(()=>prepare(quotes.data?.rows||[]),[quotes.data]);
  const houses=useMemo(()=>search(records,filters),[records,filters]);
  const [comparisonColumns,setComparisonColumns]=useState(2);
  const slots=stored.map(k=>houses.some(h=>h.key===k)?k:null);
  const removeSlot=(index:number)=>{const visible=Math.max(comparisonColumns,slots.reduce((last,key,i)=>key?i+1:last,2));const remaining=slots.slice(0,visible).filter((key,i)=>i!==index&&key);setSlots([...remaining,...Array(4-remaining.length).fill(null)]);setComparisonColumns(Math.max(2,visible-1));};
  return <Context.Provider value={{...quotes,api,records,houses,filters,setFilters,slots,setSlots,comparisonColumns,setComparisonColumns,removeSlot}}>{children}</Context.Provider>;
}
export const useCatalog=()=>{const c=useContext(Context);if(!c)throw new Error('CatalogProvider ausente');return c;};

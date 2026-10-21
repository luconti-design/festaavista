import type { Filters, House, Period, Quote, RawQuote } from '../types';
// Port of the tested rules from Domain.html. Commercial texts are not rewritten.
export const norm = (s: unknown) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
export const missing = (s: unknown) => !s || /^(nao informado|nao disponivel|-)$/i.test(norm(s));
export const show = (s: string | undefined) => missing(s) ? 'Não informado' : s;
export function price(s: string): number | null {
  const t = String(s || '').trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(t)) return null;
  const n = Number(t.replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null;
}
export const money = (n: number | null) => n == null ? 'Valor não disponível' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const periods: Record<string, number[]> = {'segunda a quinta':[1,2,3,4], 'segunda a sexta':[1,2,3,4,5], 'segunda a domingo':[1,2,3,4,5,6,0], 'sexta-feira':[5], 'sexta a domingo e feriados':[5,6,0,7], 'sabado e domingo':[6,0], 'sabado, domingo e feriados':[6,0,7]};
const groups = {weekday:[1,2,3,4], friday:[5], weekend:[6,0,7]};
export const eligible = (r: RawQuote, p: Period | '') => !!p && !!periods[norm(r['Período identificado'])] && groups[p].some(d => periods[norm(r['Período identificado'])].includes(d));
export function prepare(rows: RawQuote[]): Quote[] { return rows.map((r,i) => ({raw:r,id:i,name:missing(r['Casa para o site'])?r['Nome da casa']:r['Casa para o site'],price:price(r.Valor),guests:/^\d+$/.test((r['Quantidade de convidados']||'').trim())?Number(r['Quantidade de convidados']):null,year:(r['Ano da festa']||'').trim()})); }
export function search(records: Quote[], f: Filters, options: {strictYear?:boolean} = {}): House[] {
  if(!/^\d{4}$/.test(f.year))return [];
  const grouped = new Map<string, Quote[]>();
  records.filter(q=>q.name&&q.price!==null&&norm(q.raw.Cidade)===norm(f.city)&&q.guests===Number(f.guests)&&/^\d{4}$/.test(q.year)&&(options.strictYear?q.year===f.year:Number(q.year)<=Number(f.year))&&eligible(q.raw,f.period)&&!norm(q.raw['Pacote identificado']).includes('escolar')).forEach(q=>{
    const key=[norm(q.name),norm(q.raw.Cidade),norm(q.raw.Bairro)].join('|');
    grouped.set(key,[...(grouped.get(key)||[]),q]);
  });
  return [...grouped].map(([key,available])=>{
    // Prefer the requested year for each house. Otherwise use the most recent
    // earlier eligible year, never a cheaper older year or a future proposal.
    const referenceYear=Math.max(...available.map(q=>Number(q.year)));
    const quotes=available.filter(q=>Number(q.year)===referenceYear);
    quotes.sort((a,b)=>a.price!-b.price!||a.id-b.id);
    return {key,best:quotes[0],quotes,requestedYear:f.year,isHistorical:String(referenceYear)!==f.year};
  })
    .filter(h=>(!f.district||norm(h.best.raw.Bairro)===norm(f.district))&&(!f.venue||norm(h.best.name).includes(norm(f.venue)))&&(!f.min||h.best.price!>=Number(f.min))&&(!f.max||h.best.price!<=Number(f.max)))
    .sort((a,b)=>(f.sort==='desc'?-1:1)*(a.best.price!-b.best.price!)||a.best.name.localeCompare(b.best.name,'pt-BR'));
}
export function quoteDate(s: string) {
  const m=String(s||'').trim().match(/^(0?[1-9]|1[0-2])\/(\d{2}|\d{4})$/);
  if(!m)return 'Data da cotação não informada';
  const y=m[2].length===2?2000+Number(m[2]):Number(m[2]);
  return 'Cotação registrada em '+new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,Number(m[1])-1,1)))+'.';
}
export function notices(h: House) {
  const out: string[]=[], r=h.best.raw;
  if(new Set(h.quotes.map(q=>q.raw['Pacote identificado']).filter(p=>!missing(p))).size>1)out.push('Este é o menor valor encontrado entre os pacotes compatíveis com sua busca. Outros pacotes podem ter valores e serviços diferentes.');
  if(new Set(h.quotes.map(q=>norm(q.raw['Período identificado']))).size>1||h.quotes.some(q=>/\b12h\b/.test(q.raw['Condição do valor']||'')))out.push('Esta casa possui condições de preço diferentes conforme o dia ou horário da festa. Consulte a casa para conhecer as demais opções.');
  if(!missing(r['Pagamento identificado']))out.push('Valor referente à condição de pagamento indicada. Consulte outras formas de pagamento diretamente com a casa.');
  if(!/feriado/.test(norm(r['Período identificado'])))out.push('Feriados não confirmados para esta condição.');return out;
}
export const condition = (q: Quote) => show(q.raw['Condição do valor'])+(/12h/.test(q.raw['Condição do valor']||'')?' · Almoço (12h)':'');
export function duration(r: RawQuote) {
  if(!missing(r['Duração']))return r['Duração'];
  const text=(r['Observação da condição']||'')+' '+(r.Observações||'');
  const matches=[...text.matchAll(/(?:dura[çc][ãa]o[^\d]{0,35}(\d+)\s*h|(?:festa|evento|com)\s+(?:com\s+)?(\d+)\s*h|\b(\d+)\s+horas de evento)/gi)].map(m=>m[1]||m[2]||m[3]);
  return new Set(matches).size===1?matches[0]+' horas':'Não informado';
}
export function selectHouse(slots: (string|null)[], index: number, key: string|null): (string|null)[] {
  if(index<0||index>=4||slots.length!==4||key&&slots.some((k,i)=>i!==index&&k===key))return slots;
  return slots.map((k,i)=>i===index?key:k);
}
export const disclaimer='Confirme valores e disponibilidade diretamente com a casa.';
export const icon=(h: House)=>['✧','♧','⌂','❀','☼'][[...h.best.name].reduce((a,c)=>a+c.charCodeAt(0),0)%5];

import {Link,useParams} from 'react-router-dom';
import {useCatalog} from '../hooks/useCatalog';
import {condition,disclaimer,duration,missing,money,notices,quoteDate,show} from '../services/domain';
import {HistoricalReference} from '../components/HistoricalReference';
function Field({label,value}:{label:string;value:string|undefined}){
 const text=show(value)||'Não informado',items=text.split('|').map(item=>item.trim()).filter(Boolean);
 return <div className="detail-field"><small>{label}</small>{text.includes('|')&&items.length?<ul className="detail-list">{items.map((item,index)=><li key={index}>{item}</li>)}</ul>:text}</div>;
}
function Contact({value,label,phone=false}:{value:string;label:string;phone?:boolean}){
 let url=value?.trim()||'';
 if(missing(url))return <Field label={label} value="Não informado"/>;
 if(phone){const digits=url.replace(/\D/g,'');url=/^\d{10,13}$/.test(digits)?'tel:'+(url.startsWith('+')?'+':'')+digits:'';}
 else{if(/^www\./i.test(url))url='https://'+url;if(/^@[a-z0-9._]+$/i.test(url))url='https://www.instagram.com/'+url.slice(1)+'/';try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)url='';}catch{url='';}}
 return url?<div className="detail-field"><small>{label}</small><a href={url} target="_blank" rel="noopener noreferrer">{value} ↗</a></div>:<Field label={label} value={value}/>;
}
export function DetailsPage({modal=false}:{modal?:boolean}){const {id}=useParams(),{houses,loading}=useCatalog(),h=houses.find(h=>h.key===id);return <section className={modal?"details-content":"page-panel"}>{!modal&&<Link className="back-link" to="/">← Voltar à pesquisa</Link>}{h?<><p className="eyebrow">CONHEÇA AS POSSIBILIDADES</p><h2>{h.best.name}</h2><HistoricalReference house={h}/><p className="muted">{show(h.best.raw.Bairro)}, {h.best.raw.Cidade}</p><div className="detail-grid"><Field label="Endereço" value={h.best.raw.Endereço}/><Contact label="Instagram / site" value={h.best.raw['Instagram / site']}/><Contact label="Telefone / WhatsApp" value={h.best.raw['Telefone / WhatsApp']} phone/></div><h3>Propostas de referência para sua busca</h3>{h.quotes.map(q=><article className="quote-block" key={q.id}><small>A partir de</small><strong className="price">{money(q.price)}</strong><p>Proposta para festas em {q.year} · {q.guests} convidados</p><p>{quoteDate(q.raw['Data da cotação (MM/AA)'])}</p><div className="detail-grid"><Field label="Pacote" value={missing(q.raw['Pacote identificado'])?'Pacote não informado':q.raw['Pacote identificado']}/><Field label="Condição original do valor" value={condition(q)}/><Field label="Período" value={q.raw['Período identificado']}/><Field label="Forma de pagamento" value={missing(q.raw['Pagamento identificado'])?'Pagamento não informado':q.raw['Pagamento identificado']}/><Field label="Duração" value={duration(q.raw)}/>{['Buffet','Brinquedos','Espaço baby','Cobertura','Climatização','Área total do espaço','Outros serviços inclusos','Observações','Observação da condição'].map(k=><Field key={k} label={k} value={q.raw[k]}/>)}</div><p className="disclaimer">{disclaimer}</p></article>)}{notices(h).map(n=><p className="notice" key={n}>{n}</p>)}</>:<p className="empty">{loading?'Carregando…':'Esta casa não está entre os resultados da pesquisa atual. Volte e ajuste os filtros.'}</p>}</section>;}


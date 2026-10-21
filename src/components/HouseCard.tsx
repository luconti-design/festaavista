import {VenueIcon} from './VenueIcon';
import {Link} from 'react-router-dom';
import type {House} from '../types';
import {condition,disclaimer,missing,money,notices,show} from '../services/domain';
import {HistoricalReference} from './HistoricalReference';
export const houseUrl=(h:House)=>'/casa/'+encodeURIComponent(h.key);
export function HouseCard({house:h,rank}:{house:House;rank:number}){const q=h.best,r=q.raw;return <article className="card"><span className="rank">0{rank}</span><div className="card-title"><span className="venue-icon" aria-hidden="true"><VenueIcon/></span><div><h3>{q.name}</h3><span className="location">{show(r.Bairro)}, {r.Cidade}</span></div></div><span className="from">A partir de</span><strong className="price">{money(q.price)}</strong><HistoricalReference house={h}/><p className="meta">{!h.isHistorical&&<>Proposta para {q.year} · </>}{q.guests} convidados<br/>{condition(q)}<br/>{missing(r['Pacote identificado'])?'Pacote não informado':r['Pacote identificado']}<br/>{missing(r['Pagamento identificado'])?'Pagamento não informado':r['Pagamento identificado']}</p><Link className="detail-link" to={houseUrl(h)}>Ver detalhes ⟶</Link>{notices(h).map(n=><p className="notice" key={n}>{n}</p>)}<p className="disclaimer">{disclaimer}</p></article>;}

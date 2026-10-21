import type {House} from '../types';
export function HistoricalReference({house}:{house:House}){
 if(!house.isHistorical)return null;
 return <span className="historical-reference" role="note"><strong>Preço de referência · Festa em {house.best.year}</strong><span>Você buscou {house.requestedYear}. Ainda não temos um valor para esse ano.</span></span>;
}

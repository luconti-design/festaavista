import type {RawQuote} from '../types';
// Only imported by Vite development mode; never present in the production bundle.
export const mockQuotes: RawQuote[] = Array.from({length:6},(_,i)=>({
 'Nome da casa':`DEMO LOCAL ${i+1}`,'Casa para o site':`DEMO LOCAL ${i+1}`,Cidade:'Niterói',Bairro:'Bairro de teste',
 'Quantidade de convidados':'80','Ano da festa':'2027',Valor:`R$ ${8000+i*1000},00`,
 'Condição do valor':'Segunda a quinta','Período identificado':'Segunda a quinta','Pacote identificado':'DEMONSTRAÇÃO',
 'Pagamento identificado':'Não informado','Data da cotação (MM/AA)':'10/26',
}));

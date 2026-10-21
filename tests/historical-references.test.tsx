import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from '../src/App';
import type {RawQuote} from '../src/types';
const api=vi.hoisted(()=>({create:vi.fn()}));
vi.mock('../src/services/api',()=>({createApi:()=>api.create()}));
const row=(name:string,year:string,price:string):RawQuote=>({'Nome da casa':name,'Casa para o site':name,Cidade:'Niterói',Bairro:'Centro','Quantidade de convidados':'80','Ano da festa':year,Valor:price,'Período identificado':'Segunda a quinta','Condição do valor':'Segunda a quinta','Data da cotação (MM/AA)':'10/26'});
beforeEach(()=>{window.location.hash='#/';sessionStorage.clear();localStorage.clear();localStorage.setItem('festa-search-v1',JSON.stringify({city:'Niterói',guests:'80',year:'2027',period:'weekday'}));api.create.mockReturnValue(Promise.resolve({getQuotes:async()=>({rows:[row('Casa atual','2027','R$ 12.000,00'),row('Casa anterior','2026','R$ 9.000,00'),row('Casa antiga','2025','R$ 7.000,00')],fetchedAt:new Date().toISOString(),stale:false})}));});
afterEach(()=>{cleanup();vi.clearAllMocks();});
test('historical year and unconfirmed target price are visible in ranking and list',async()=>{
 render(<App/>);await screen.findByRole('heading',{name:'Casa anterior'});
 const ranking=screen.getByRole('tabpanel',{name:'3 menores valores'}),card=within(ranking).getByRole('heading',{name:'Casa anterior'}).closest('article')!;
 expect(within(card).getByText('Preço de referência · Festa em 2026')).toBeTruthy();expect(within(card).getByText('Você buscou 2027. Ainda não temos um valor para esse ano.')).toBeTruthy();expect(within(card).getByText(/9\.000,00/)).toBeTruthy();
 const current=within(ranking).getByRole('heading',{name:'Casa atual'}).closest('article')!;expect(within(current).queryByRole('note')).toBeNull();
 const listing=screen.getByRole('link',{name:'Ver detalhes de Casa anterior'});expect(within(listing).getAllByText('Referência 2026')).toHaveLength(2);expect(within(listing).getAllByText('2027 não confirmado')).toHaveLength(2);expect(within(listing).queryByText('Você buscou 2027. Ainda não temos um valor para esse ano.')).toBeNull();
 expect(screen.queryByRole('region',{name:'Disponibilidade dos dados'})).toBeNull();
});
test('comparison and details preserve the historical warning and the real year',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'Casa anterior'});await user.click(screen.getByRole('tab',{name:'Compare as casas'}));
 const select=screen.getByRole('combobox',{name:'Selecionar casa 1'}),option=within(select).getByRole('option',{name:'Casa anterior'}) as HTMLOptionElement;await user.selectOptions(select,option.value);
 const comparison=screen.getByRole('tabpanel',{name:'Compare as casas'});expect(within(comparison).queryByText('Referência 2026')).toBeNull();expect(within(comparison).getByText('2026 · 80')).toBeTruthy();await user.click(within(comparison).getByRole('button',{name:'Informações do valor de Casa anterior'}));const tooltip=screen.getByRole('tooltip');expect(within(tooltip).getByText('Preço de referência · Festa em 2026')).toBeTruthy();expect(within(tooltip).getByText(/Você buscou 2027/)).toBeTruthy();await user.keyboard('{Escape}');expect(screen.queryByRole('tooltip')).toBeNull();
 await user.click(within(comparison).getByRole('link',{name:'Ver detalhes ⟶'}));await screen.findByRole('heading',{name:'Propostas de referência para sua busca'});const details=screen.getByRole('dialog',{name:'Detalhes da casa'});expect(within(details).getByText('Preço de referência · Festa em 2026')).toBeTruthy();expect(within(details).getByText('Você buscou 2027. Ainda não temos um valor para esse ano.')).toBeTruthy();expect(within(details).getByText('Proposta para festas em 2026 · 80 convidados')).toBeTruthy();
});

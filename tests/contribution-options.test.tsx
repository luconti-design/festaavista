import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from '../src/App';
import {mockQuotes} from '../src/mocks/quotes';
import {ManualQuoteOptions} from '../src/components/ManualQuoteOptions';
const mocks=vi.hoisted(()=>({submit:vi.fn(),api:vi.fn()}));
vi.mock('../src/services/api',()=>({createApi:()=>mocks.api()}));
beforeEach(()=>{sessionStorage.clear();localStorage.clear();localStorage.setItem('festa-search-v1',JSON.stringify({city:'Niterói',guests:'80',year:'2027',period:'weekday'}));window.location.hash='#/';mocks.submit.mockResolvedValue({ok:true,message:'Recebido em teste'});mocks.api.mockReturnValue(Promise.resolve({getQuotes:async()=>({rows:mockQuotes,fetchedAt:new Date().toISOString(),stale:false}),beginContribution:async()=>({token:'test',signature:'test',issued:Date.now()-3000,expires:Date.now()+100000}),submitContribution:mocks.submit}));});
afterEach(()=>{cleanup();vi.clearAllMocks();});
test('manual submission sends several explicitly entered quantities/prices in one contribution',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});await user.click(screen.getAllByRole('link',{name:'Quero contribuir'})[0]);await user.click(screen.getByRole('button',{name:/Quero preencher/}));
 await user.type(screen.getByLabelText('Nome da casa *'),'Casa informada');await user.type(screen.getByLabelText('Cidade *'),'Niterói');await user.type(screen.getByLabelText('Ano da festa *'),'2027');
 await user.type(screen.getByLabelText('Quantidade de convidados *'),'100');await user.type(screen.getByLabelText('Valor total em reais *'),'12000');
 await user.click(screen.getByRole('button',{name:/Adicionar outra quantidade/}));
 await user.type(screen.getAllByLabelText('Quantidade de convidados *')[1],'80');await user.type(screen.getAllByLabelText('Valor total em reais *')[1],'9900.50');
 await user.click(screen.getByRole('checkbox',{name:/Confirmo/}));await user.click(screen.getByRole('checkbox',{name:/Autorizo/}));await user.click(screen.getByRole('button',{name:/Enviar para conferência/}));
 await waitFor(()=>expect(mocks.submit).toHaveBeenCalledTimes(1));
 expect(mocks.submit.mock.calls[0][0].options).toEqual([{guests:'100',price:'12000'},{guests:'80',price:'9900.5'}]);expect(mocks.submit.mock.calls[0][0].year).toBe('2027');
});
test('removing a line preserves other typed prices and never calculates a proportional value',async()=>{
 const user=userEvent.setup(),changed=vi.fn();render(<ManualQuoteOptions onChange={changed}/>);
 await user.type(screen.getByLabelText('Quantidade de convidados *'),'100');await user.type(screen.getByLabelText('Valor total em reais *'),'10000');await user.click(screen.getByRole('button',{name:/Adicionar outra quantidade/}));
 expect((screen.getAllByLabelText('Valor total em reais *')[1] as HTMLInputElement).value).toBe('');
 await user.type(screen.getAllByLabelText('Quantidade de convidados *')[1],'80');await user.type(screen.getAllByLabelText('Valor total em reais *')[1],'9000');await user.click(screen.getByRole('button',{name:'Remover opção 1'}));
 expect(changed.mock.calls.at(-1)?.[0]).toEqual([{guests:'80',price:'9000'}]);expect((screen.getByLabelText('Valor total em reais *') as HTMLInputElement).value).toBe('9000');expect(screen.queryByRole('button',{name:/Remover opção/})).toBeNull();
});
test('coverage explicitly changes year and period without mixing years',async()=>{
 const scroll=vi.fn();Element.prototype.scrollIntoView=scroll;
 const user=userEvent.setup(),older=mockQuotes.slice(0,6).map((r,i)=>({...r,'Nome da casa':'Ano anterior '+i,'Casa para o site':'Ano anterior '+i,'Ano da festa':'2026','Período identificado':'Sábado e domingo'}));
 mocks.api.mockReturnValue(Promise.resolve({getQuotes:async()=>({rows:[...mockQuotes,...older],fetchedAt:new Date().toISOString(),stale:false})}));
 render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});await user.click(screen.getByRole('button',{name:'Próxima página'}));await user.click(screen.getByRole('button',{name:'Consultar 2027, sábado, domingo ou feriado: mais 6 casas'}));
 expect((screen.getByRole('combobox',{name:'Ano da festa'}) as HTMLSelectElement).value).toBe('2027');expect((screen.getByRole('combobox',{name:'Período'}) as HTMLSelectElement).value).toBe('weekend');
 const ranking=screen.getByRole('tabpanel',{name:'3 menores valores'});expect(within(ranking).getAllByRole('heading').map(h=>h.textContent)).toEqual(['Ano anterior 0','Ano anterior 1','Ano anterior 2']);expect(within(ranking).queryByText('DEMO LOCAL 1')).toBeNull();await waitFor(()=>expect(scroll).toHaveBeenCalled());expect(scroll.mock.instances.at(-1)).toBe(document.getElementById('explore'));expect(screen.getByRole('link',{name:'Ver detalhes de Ano anterior 0'})).toBeTruthy();expect(screen.queryByRole('link',{name:'Ver detalhes de Ano anterior 5'})).toBeNull();
});

import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from '../src/App';
import {mockQuotes} from '../src/mocks/quotes';
const mocks=vi.hoisted(()=>({submit:vi.fn(),api:vi.fn()}));
vi.mock('../src/services/api',()=>({createApi:()=>mocks.api()}));
beforeEach(()=>{
 window.location.hash='#/';localStorage.clear();sessionStorage.clear();localStorage.setItem('festa-search-v1',JSON.stringify({city:'Niterói',guests:'80',year:'2027',period:'weekday'}));
 mocks.submit.mockResolvedValue({ok:true,message:'Recebido em teste'});
 mocks.api.mockReturnValue(Promise.resolve({getQuotes:async()=>({rows:mockQuotes,fetchedAt:new Date().toISOString(),stale:false}),beginContribution:async()=>({token:'test',signature:'test',issued:Date.now()-3000,expires:Date.now()+100000}),submitContribution:mocks.submit}));
});
afterEach(()=>{cleanup();vi.clearAllMocks();});
test('four independent comparison slots, no duplicate and removal; list stays below',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 await user.click(screen.getByRole('tab',{name:'Compare as casas'}));
 expect(screen.getAllByRole("combobox",{name:/Selecionar casa/})).toHaveLength(2);
 for(let i=1;i<=4;i++){
   if(i>2)await user.click(screen.getByRole("button",{name:"Adicionar casa ao comparativo"}));
   const select=screen.getByRole('combobox',{name:'Selecionar casa '+i});
   const option=within(select).getByRole('option',{name:'DEMO LOCAL '+i}) as HTMLOptionElement;
   await user.selectOptions(select,option.value);
 }
 expect(screen.getByText('4 de 4 selecionadas')).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Adicionar casa ao comparativo'})).toBeNull();
 expect(screen.getAllByRole('combobox',{name:/Selecionar casa/})).toHaveLength(4);
 expect(within(screen.getByRole('combobox',{name:'Selecionar casa 2'})).queryByRole('option',{name:'DEMO LOCAL 1'})).toBeNull();
 await user.click(screen.getAllByRole('button',{name:'Remover ×'})[0]);
 expect(screen.getByText('3 de 4 selecionadas')).toBeTruthy();expect(screen.getAllByRole('combobox',{name:/Selecionar casa/})).toHaveLength(3);await user.click(screen.getAllByRole('button',{name:'Remover ×'})[0]);expect(screen.getAllByRole('combobox',{name:/Selecionar casa/})).toHaveLength(2);
 expect(screen.getByRole('heading',{name:'Explore todas as casas'})).toBeTruthy();
 expect(screen.getAllByRole('checkbox',{name:/Comparar DEMO/})).toHaveLength(5);
});
test('theme retains controls and details route retains packages',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 await user.click(screen.getByRole('button',{name:'Alternar tema'}));expect(document.documentElement.dataset.theme).toBe('dark');
 expect(screen.getByRole('combobox',{name:'Período'})).toBeTruthy();
 await user.click(screen.getAllByRole('link',{name:'Ver detalhes ⟶'})[0]);
 await screen.findByRole('heading',{name:'Propostas de referência para sua busca'});
 expect(window.location.hash).toContain('/casa/');
});
test('three lowest cards stay lowest when explore ordering is descending',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 await user.selectOptions(screen.getByRole('combobox',{name:'Ordenação'}),'desc');
 const ranking=screen.getByRole('tabpanel',{name:'3 menores valores'});
 expect(within(ranking).getAllByRole('heading').map(h=>h.textContent)).toEqual(['DEMO LOCAL 1','DEMO LOCAL 2','DEMO LOCAL 3']);
});
test('manual form uses the API once, separate from public quotes',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 await user.click(screen.getAllByRole('link',{name:'Quero contribuir'})[0]);await user.click(screen.getByRole('button',{name:/Quero preencher/}));
 for(const [label,value] of [['Nome da casa *','Casa informada'],['Cidade *','Niterói'],['Quantidade de convidados *','80'],['Ano da festa *','2027'],['Valor total em reais *','9000']])await user.type(screen.getByLabelText(label),value);
 await user.click(screen.getByRole('checkbox',{name:/Confirmo/}));await user.click(screen.getByRole('checkbox',{name:/Autorizo/}));
 await user.click(screen.getByRole('button',{name:/Enviar para conferência/}));
 await waitFor(()=>expect(mocks.submit).toHaveBeenCalledTimes(1));
 expect(mocks.submit.mock.calls[0][0].files).toEqual([]);
 expect(mocks.submit.mock.calls[0][0].type).toBe('manual');
 await screen.findByText('Recebido em teste');
});

test('list selection shares four slots and selectors use the filtered houses',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 for(let i=1;i<=4;i++)await user.click(screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL '+i}));
 expect((screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL 5'}) as HTMLInputElement).disabled).toBe(true);
 await user.click(screen.getByRole('button',{name:'Próxima página'}));
 expect((screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL 6'}) as HTMLInputElement).disabled).toBe(true);
 await user.click(screen.getByRole('button',{name:'Ver comparação ⟶'}));
 expect(screen.getByRole('tab',{name:'Compare as casas'}).getAttribute('aria-selected')).toBe('true');
 await user.click(screen.getAllByRole('button',{name:'Remover ×'})[0]);
 expect(screen.queryByRole('searchbox',{name:'Buscar casa 1'})).toBeNull();
 const selector=screen.getByRole('combobox',{name:'Selecionar casa 1'});

 const option=within(selector).getByRole('option',{name:'DEMO LOCAL 6'}) as HTMLOptionElement;
 await user.selectOptions(selector,option.value);
 expect((screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL 6'}) as HTMLInputElement).checked).toBe(true);
 expect((selector as HTMLSelectElement).value).toBe(option.value);
});

test('comparison reveals essential rows on selection and collapses completely after removal',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 await user.click(screen.getByRole('tab',{name:'Compare as casas'}));
 const panel=screen.getByRole('tabpanel',{name:'Compare as casas'});
 expect(within(panel).queryByRole('rowheader',{name:'Valor de referência'})).toBeNull();
 expect(within(panel).getByText('Escolha as casas para começar a comparar.')).toBeTruthy();
 const select=within(panel).getByRole('combobox',{name:'Selecionar casa 1'});
 await user.selectOptions(select,(within(select).getByRole('option',{name:'DEMO LOCAL 1'}) as HTMLOptionElement).value);
 expect(within(panel).getByRole('rowheader',{name:'Valor de referência'})).toBeTruthy();
 expect(within(panel).queryByRole('rowheader',{name:'Buffet'})).toBeNull();
 await user.click(within(panel).getByRole('button',{name:'Ver mais informações +'}));
 expect(within(panel).getByRole('rowheader',{name:'Buffet'})).toBeTruthy();
 await user.click(within(panel).getByRole('button',{name:'Ver menos informações −'}));
 expect(within(panel).queryByRole('rowheader',{name:'Buffet'})).toBeNull();
 await user.click(within(panel).getByRole('button',{name:'Remover ×'}));
 expect(within(panel).queryByRole('rowheader')).toBeNull();
 expect(within(panel).queryByRole('button',{name:'Ver mais informações +'})).toBeNull();
});

test('first visit is blank, complete search persists across visits, partial search stays hidden',async()=>{
 localStorage.clear();sessionStorage.clear();const user=userEvent.setup();render(<App/>);
 await screen.findByRole('option',{name:'Niterói'});
 for(const name of ['Cidade','Convidados','Ano da festa','Período'])expect((screen.getByRole('combobox',{name}) as HTMLSelectElement).value).toBe('');
 expect(screen.queryByRole('heading',{name:'Explore todas as casas'})).toBeNull();
 await user.selectOptions(screen.getByRole('combobox',{name:'Cidade'}),'Niterói');
 await user.selectOptions(screen.getByRole('combobox',{name:'Convidados'}),'80');
 await user.selectOptions(screen.getByRole('combobox',{name:'Ano da festa'}),'2027');
 expect(screen.queryByRole('heading',{name:'Explore todas as casas'})).toBeNull();
 await user.selectOptions(screen.getByRole('combobox',{name:'Período'}),'weekday');
 expect(screen.getByRole('heading',{name:'Explore todas as casas'})).toBeTruthy();
 cleanup();sessionStorage.clear();render(<App/>);
 await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 expect((screen.getByRole('combobox',{name:'Convidados'}) as HTMLSelectElement).value).toBe('80');
 expect((screen.getByRole('combobox',{name:'Ano da festa'}) as HTMLSelectElement).value).toBe('2027');
});

test('clicking list checkboxes removes and compacts the comparison exactly like Remove',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 for(let i=1;i<=4;i++)await user.click(screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL '+i}));
 await user.click(screen.getByRole('button',{name:'Ver comparação ⟶'}));
 expect(screen.getAllByRole('combobox',{name:/Selecionar casa/})).toHaveLength(4);
 await user.click(screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL 2'}));
 expect(screen.getAllByRole('combobox',{name:/Selecionar casa/})).toHaveLength(3);
 const second=screen.getByRole('combobox',{name:'Selecionar casa 2'}) as HTMLSelectElement;
 expect(second.selectedOptions[0].textContent).toBe('DEMO LOCAL 3');
 await user.click(screen.getAllByRole('button',{name:'Remover ×'})[1]);
 expect(screen.getAllByRole('combobox',{name:/Selecionar casa/})).toHaveLength(2);
 expect((screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL 3'}) as HTMLInputElement).checked).toBe(false);
 const secondAfter=screen.getByRole('combobox',{name:'Selecionar casa 2'}) as HTMLSelectElement;
 expect(secondAfter.selectedOptions[0].textContent).toBe('DEMO LOCAL 4');
 await user.click(screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL 1'}));
 await user.click(screen.getByRole('checkbox',{name:'Comparar DEMO LOCAL 4'}));
 expect(screen.getByText('Escolha as casas para começar a comparar.')).toBeTruthy();
 expect(screen.queryByRole('rowheader',{name:'Valor de referência'})).toBeNull();
});

test('menu, contribution navigation, search submit and value filters remain operable',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});
 expect(screen.queryByRole('button',{name:'Abrir menu'})).toBeNull();
 await user.click(screen.getAllByRole('link',{name:'Quero contribuir'})[0]);expect(screen.getByRole('button',{name:'Alternar tema'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:/Tenho um PDF/}));expect(screen.getByLabelText(/Documentos/)).toBeTruthy();
 await user.click(screen.getByRole('link',{name:'← Voltar à pesquisa'}));
 const scroll=vi.fn();Element.prototype.scrollIntoView=scroll;vi.stubGlobal('matchMedia',()=>({matches:false}));
 await user.click(screen.getByRole('button',{name:'Buscar casas'}));expect(scroll).toHaveBeenCalled();vi.unstubAllGlobals();
 await user.click(screen.getByText('Mais filtros'));await user.type(screen.getByLabelText(/Valor máximo/),'1');
 expect(screen.queryByRole('link',{name:'Ver detalhes de DEMO LOCAL 1'})).toBeNull();
 await user.clear(screen.getByLabelText('Valor máximo (R$)'));expect(screen.getByRole('link',{name:'Ver detalhes de DEMO LOCAL 1'})).toBeTruthy();
});

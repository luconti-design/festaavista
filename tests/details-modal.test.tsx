import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from '../src/App';
import {mockQuotes} from '../src/mocks/quotes';
const api=vi.hoisted(()=>({create:vi.fn()}));
vi.mock('../src/services/api',()=>({createApi:()=>api.create()}));
beforeEach(()=>{window.location.hash='#/';sessionStorage.clear();localStorage.clear();localStorage.setItem('festa-search-v1',JSON.stringify({city:'Niterói',guests:'80',year:'2027',period:'weekday'}));api.create.mockReturnValue(Promise.resolve({getQuotes:async()=>({rows:mockQuotes,fetchedAt:new Date().toISOString(),stale:false})}));});
afterEach(()=>{cleanup();vi.clearAllMocks();});
test('details overlay keeps the mounted results, page and focus on close',async()=>{
 const user=userEvent.setup();render(<App/>);const originalHeading=await screen.findByRole('heading',{name:'Explore todas as casas'});
 await user.click(screen.getByRole('button',{name:'2'}));const opener=screen.getByRole('link',{name:'Ver detalhes de DEMO LOCAL 6'});await user.click(opener);
 const dialog=screen.getByRole('dialog',{name:'Detalhes da casa'});expect(within(dialog).getByRole('heading',{name:'DEMO LOCAL 6'})).toBeTruthy();expect(screen.getByRole('heading',{name:'Explore todas as casas'})).toBe(originalHeading);
 expect(document.documentElement.style.overflow).toBe('hidden');expect(document.activeElement).toBe(within(dialog).getByRole('button',{name:'Fechar detalhes'}));
 await user.click(within(dialog).getByRole('button',{name:'Fechar detalhes'}));expect(screen.queryByRole('dialog')).toBeNull();expect(document.documentElement.style.overflow).toBe('');expect(screen.getByRole('button',{name:'2'}).getAttribute('aria-current')).toBe('page');expect(document.activeElement).toBe(opener);
});
test('cancel closes the popup and retains comparison selection',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByRole('heading',{name:'DEMO LOCAL 1'});await user.click(screen.getByRole('tab',{name:'Compare as casas'}));
 const select=screen.getByRole('combobox',{name:'Selecionar casa 1'}),option=within(select).getByRole('option',{name:'DEMO LOCAL 1'}) as HTMLOptionElement;await user.selectOptions(select,option.value);
 const comparison=screen.getByRole('tabpanel',{name:'Compare as casas'});await user.click(within(comparison).getByRole('link',{name:'Ver detalhes ⟶'}));fireEvent(screen.getByRole('dialog'),new Event('cancel',{bubbles:false,cancelable:true}));
 expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByRole('tab',{name:'Compare as casas'}).getAttribute('aria-selected')).toBe('true');expect((screen.getByRole('combobox',{name:'Selecionar casa 1'}) as HTMLSelectElement).value).toBe(option.value);
});
test('opening a direct details link also displays the home behind the dialog',async()=>{
 window.location.hash='#/casa/'+encodeURIComponent('demo local 6|niteroi|bairro de teste');const user=userEvent.setup();render(<App/>);
 await screen.findByRole('heading',{name:'Propostas de referência para sua busca'});expect(screen.getByRole('dialog',{name:'Detalhes da casa'})).toBeTruthy();expect(screen.getByRole('heading',{name:'Explore todas as casas'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Fechar detalhes'}));expect(window.location.hash).toBe('#/');expect(screen.queryByRole('dialog')).toBeNull();
});

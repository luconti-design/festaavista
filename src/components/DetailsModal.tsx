import {useEffect,useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {DetailsPage} from '../pages/DetailsPage';

export function DetailsModal(){
 const dialog=useRef<HTMLDialogElement>(null),closeButton=useRef<HTMLButtonElement>(null),navigate=useNavigate();
 const close=()=>navigate('/',{replace:true});
 useEffect(()=>{
  const element=dialog.current;
  if(!element)return;
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.documentElement.style.overflow;
  element.showModal();
  document.documentElement.style.overflow='hidden';
  closeButton.current?.focus({preventScroll:true});
  return ()=>{
   element.close();document.documentElement.style.overflow=previousOverflow;
   if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  };
 },[]);
 return <dialog ref={dialog} className="details-modal" aria-label="Detalhes da casa" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{
  if(e.target!==e.currentTarget)return;
  const bounds=e.currentTarget.getBoundingClientRect();
  if(e.clientX<bounds.left||e.clientX>bounds.right||e.clientY<bounds.top||e.clientY>bounds.bottom)close();
 }}><button ref={closeButton} className="modal-close" aria-label="Fechar detalhes" onClick={close}>×</button><DetailsPage modal/></dialog>;
}

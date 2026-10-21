import {useEffect,useState} from 'react';
export function useTheme(){
 const [dark,setDark]=useState(()=>{try{return localStorage.getItem('festa-theme')==='dark';}catch{return false;}});
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';try{localStorage.setItem('festa-theme',dark?'dark':'light');}catch{/* Storage optional. */}},[dark]);
 return {dark,toggle:()=>setDark(v=>!v)};
}

import {HashRouter,Link,Navigate,Outlet,Route,Routes} from 'react-router-dom';
import {CatalogProvider} from './hooks/useCatalog';
import {Layout} from './components/Layout';
import {HomePage} from './pages/HomePage';
import {DetailsModal} from './components/DetailsModal';
import {ContributionPage} from './pages/ContributionPage';
function ResultsWithOverlay(){return <><HomePage/><Outlet/></>;}
export function App(){return <HashRouter><CatalogProvider><Routes><Route element={<Layout/>}><Route element={<ResultsWithOverlay/>}><Route index element={null}/><Route path="casa/:id" element={<DetailsModal/>}/></Route><Route path="explore" element={<Navigate to="/" replace/>}/><Route path="contribuir" element={<ContributionPage/>}/><Route path="*" element={<section className="page-panel"><h2>Página não encontrada</h2><Link to="/">Voltar à pesquisa</Link></section>}/></Route></Routes></CatalogProvider></HashRouter>;}

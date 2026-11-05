import { useCallback, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import MovementsPage from './pages/MovementsPage.jsx';

const pages = {
  dashboard: DashboardPage,
  products: ProductsPage,
  categories: CategoriesPage,
  movements: MovementsPage,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const Page = pages[page];

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-shell">
        <Header page={page} onMenuOpen={() => setMenuOpen(true)} />
        <main className="page-container" key={page}>
          <Page notify={notify} />
        </main>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

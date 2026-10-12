import { useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import Layout from './components/Layout';
import { useSettings } from './context/SettingsContext';
import { buildTheme } from './theme';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionNewPage from './pages/TransactionNewPage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const { themeMode } = useSettings();
  const theme = useMemo(() => buildTheme(themeMode), [themeMode]);

  // No authentication: every route is public and "/" opens the Dashboard directly.
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/new" element={<TransactionNewPage />} />
          <Route path="transactions/:id" element={<TransactionDetailsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { SettingsProvider } from './context/SettingsContext';

const summary = {
  month: 10,
  year: 2026,
  totalIncome: 100000,
  totalExpenses: 40000,
  balance: 60000,
  monthIncome: 85000,
  monthExpenses: 30000,
  recentTransactions: [],
  expensesByCategory: [],
  budgetUsage: [],
  trend: [],
};

vi.mock('./api/reports', () => ({
  getDashboardSummary: vi.fn(() => Promise.resolve(summary)),
  getMonthlyReport: vi.fn(() => Promise.resolve([])),
  getCategoryBreakdown: vi.fn(() => Promise.resolve([])),
}));

function renderAt(path) {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </SettingsProvider>,
  );
}

describe('App routing (no authentication)', () => {
  it('opens the Dashboard directly at "/" without any login screen', async () => {
    renderAt('/');

    expect(await screen.findByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Current Balance')).toBeInTheDocument();
    expect(screen.queryByText(/log ?in|sign ?in|password/i)).not.toBeInTheDocument();
  });

  it('shows the Not Found page for unknown routes', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});

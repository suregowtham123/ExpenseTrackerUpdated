import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddIcon from '@mui/icons-material/Add';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardSummary } from '../api/reports';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { ErrorAlert, LoadingState } from '../components/StateViews';
import { useSettings } from '../context/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { CHART_COLORS } from '../theme';
import { budgetColor } from '../utils/budget';
import { formatDate, monthLabel, parseMonthInput, toDateOnly, toMonthInput } from '../utils/format';

export default function DashboardPage() {
  const { formatMoney } = useSettings();
  const [period, setPeriod] = useState(() => toMonthInput(new Date()));
  const parsed = useMemo(() => parseMonthInput(period) ?? parseMonthInput(toMonthInput(new Date())), [period]);

  const { data, loading, error, reload } = useAsync(() => getDashboardSummary(parsed.month, parsed.year), [parsed.month, parsed.year]);

  const trendData = useMemo(
    () => (data?.trend ?? []).map((t) => ({ label: monthLabel(t.year, t.month), Income: t.income, Expenses: t.expenses })),
    [data],
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${monthLabel(parsed.year, parsed.month)}`}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              type="month"
              size="small"
              label="Month"
              value={period}
              onChange={(e) => parseMonthInput(e.target.value) && setPeriod(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button component={RouterLink} to="/transactions/new" variant="contained" startIcon={<AddIcon />}>
              Add
            </Button>
          </Stack>
        }
      />

      {error && <ErrorAlert message={error} onRetry={reload} />}
      {!data && loading && <LoadingState />}

      {data && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Total Income" value={formatMoney(data.totalIncome)} icon={<TrendingUpIcon />} color="success.main" caption="All time" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Total Expenses" value={formatMoney(data.totalExpenses)} icon={<TrendingDownIcon />} color="error.main" caption="All time" />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Current Balance"
              value={formatMoney(data.balance)}
              icon={<AccountBalanceWalletIcon />}
              color={data.balance >= 0 ? 'primary.main' : 'error.main'}
              caption="Income minus expenses"
            />
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {monthLabel(data.year, data.month)} summary
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 6 }}>
                  <Typography>
                    Income: <strong>{formatMoney(data.monthIncome)}</strong>
                  </Typography>
                  <Typography>
                    Expenses: <strong>{formatMoney(data.monthExpenses)}</strong>
                  </Typography>
                  <Typography color={data.monthIncome - data.monthExpenses >= 0 ? 'success.main' : 'error.main'}>
                    Saved: <strong>{formatMoney(data.monthIncome - data.monthExpenses)}</strong>
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expenses by category
                </Typography>
                {data.expensesByCategory.length === 0 ? (
                  <Typography color="text.secondary">No expenses recorded this month.</Typography>
                ) : (
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={data.expensesByCategory} dataKey="total" nameKey="categoryName" innerRadius={55} outerRadius={95} paddingAngle={2}>
                          {data.expensesByCategory.map((entry, i) => (
                            <Cell key={entry.categoryId} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatMoney(Number(v))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Spending trend (6 months)
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v))} />
                      <Tooltip formatter={(v) => formatMoney(Number(v))} />
                      <Legend />
                      <Bar dataKey="Income" fill="#1f8a52" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#c2543a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">Budget usage</Typography>
                  <Button component={RouterLink} to="/budgets" size="small">
                    Manage
                  </Button>
                </Stack>
                {data.budgetUsage.length === 0 ? (
                  <Typography color="text.secondary">No budgets set for this month.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {data.budgetUsage.map((b) => (
                      <Box key={b.budgetId}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>
                            {b.categoryName}
                          </Typography>
                          <Typography variant="body2" color={b.isExceeded ? 'error.main' : 'text.secondary'}>
                            {formatMoney(b.spent)} / {formatMoney(b.limitAmount)}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(b.percentUsed, 100)}
                          color={budgetColor(b.percentUsed)}
                          sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                        />
                        {b.isExceeded && (
                          <Typography variant="caption" color="error.main">
                            Over budget by {formatMoney(Math.abs(b.remaining))}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Recent transactions</Typography>
                  <Button component={RouterLink} to="/transactions" size="small">
                    View all
                  </Button>
                </Stack>
                {data.recentTransactions.length === 0 ? (
                  <Typography color="text.secondary">No transactions yet.</Typography>
                ) : (
                  <List disablePadding>
                    {data.recentTransactions.map((t) => (
                      <ListItemButton key={t.transactionId} component={RouterLink} to={`/transactions/${t.transactionId}`} sx={{ borderRadius: 2 }}>
                        <ListItemText
                          primary={t.title}
                          secondary={`${formatDate(toDateOnly(t.date))} · ${t.categoryName}`}
                        />
                        <Chip
                          size="small"
                          color={t.type === 'Income' ? 'success' : 'error'}
                          variant="outlined"
                          label={`${t.type === 'Income' ? '+' : '−'} ${formatMoney(t.amount)}`}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );
}

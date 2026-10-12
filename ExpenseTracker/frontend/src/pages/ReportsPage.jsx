import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getCategoryBreakdown, getMonthlyReport } from '../api/reports';
import PageHeader from '../components/PageHeader';
import { ErrorAlert, LoadingState } from '../components/StateViews';
import { useSettings } from '../context/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { CHART_COLORS } from '../theme';
import { monthLabel, toDateInput } from '../utils/format';

export default function ReportsPage() {
  const { formatMoney } = useSettings();
  const today = new Date();
  const [from, setFrom] = useState(toDateInput(new Date(today.getFullYear(), 0, 1)));
  const [to, setTo] = useState(toDateInput(today));
  const [granularity, setGranularity] = useState('monthly');
  const [breakdownType, setBreakdownType] = useState('Expense');

  const rangeValid = Boolean(from) && Boolean(to) && from <= to;

  const monthly = useAsync(() => (rangeValid ? getMonthlyReport(from, to) : Promise.resolve([])), [from, to, rangeValid]);
  const breakdown = useAsync(
    () => (rangeValid ? getCategoryBreakdown(from, to, breakdownType) : Promise.resolve([])),
    [from, to, breakdownType, rangeValid],
  );

  const rows = useMemo(() => {
    const data = monthly.data ?? [];
    if (granularity === 'monthly') {
      return data.map((m) => ({ label: monthLabel(m.year, m.month), income: m.income, expenses: m.expenses, net: m.net }));
    }
    const byYear = new Map();
    for (const m of data) {
      const row = byYear.get(m.year) ?? { label: String(m.year), income: 0, expenses: 0, net: 0 };
      row.income += m.income;
      row.expenses += m.expenses;
      row.net += m.net;
      byYear.set(m.year, row);
    }
    return [...byYear.values()];
  }, [monthly.data, granularity]);

  const totals = useMemo(
    () => rows.reduce((acc, r) => ({ income: acc.income + r.income, expenses: acc.expenses + r.expenses, net: acc.net + r.net }), { income: 0, expenses: 0, net: 0 }),
    [rows],
  );

  const categoryRows = breakdown.data ?? [];
  const compactTick = (v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v));

  return (
    <>
      <PageHeader title="Reports" subtitle="Analyse income, expenses and category spending over any date range" />

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField label="From" type="date" size="small" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField
              label="To"
              type="date"
              size="small"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(from && to && from > to)}
              helperText={from && to && from > to ? 'End date must be after start date' : undefined}
            />
            <Box sx={{ flexGrow: 1 }} />
            <ToggleButtonGroup size="small" exclusive value={granularity} onChange={(_, v) => v && setGranularity(v)} aria-label="Report granularity">
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="yearly">Yearly</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {monthly.error && <ErrorAlert message={monthly.error} onRetry={monthly.reload} />}
      {breakdown.error && <ErrorAlert message={breakdown.error} onRetry={breakdown.reload} />}
      {!monthly.data && monthly.loading && <LoadingState />}

      {monthly.data && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Income vs expenses ({granularity})
                </Typography>
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={rows}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={compactTick} />
                      <Tooltip formatter={(v) => formatMoney(Number(v))} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#1f8a52" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#c2543a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Net savings
                </Typography>
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={rows}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={compactTick} />
                      <Tooltip formatter={(v) => formatMoney(Number(v))} />
                      <Line type="monotone" dataKey="net" name="Net" stroke="#0f5c52" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={7}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" aria-label="Summary table">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Income</TableCell>
                    <TableCell align="right">Expenses</TableCell>
                    <TableCell align="right">Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell align="right">{formatMoney(r.income)}</TableCell>
                      <TableCell align="right">{formatMoney(r.expenses)}</TableCell>
                      <TableCell align="right" sx={{ color: r.net >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                        {formatMoney(r.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoney(totals.income)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoney(totals.expenses)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoney(totals.net)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">By category</Typography>
                  <ToggleButtonGroup size="small" exclusive value={breakdownType} onChange={(_, v) => v && setBreakdownType(v)} aria-label="Category breakdown type">
                    <ToggleButton value="Expense">Expenses</ToggleButton>
                    <ToggleButton value="Income">Income</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                {categoryRows.length === 0 ? (
                  <Typography color="text.secondary">No data for this range.</Typography>
                ) : (
                  <>
                    <Box sx={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={categoryRows} dataKey="total" nameKey="categoryName" innerRadius={45} outerRadius={85} paddingAngle={2}>
                            {categoryRows.map((c, i) => (
                              <Cell key={c.categoryId} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatMoney(Number(v))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Table size="small" aria-label="Category breakdown table">
                      <TableBody>
                        {categoryRows.map((c, i) => (
                          <TableRow key={c.categoryId}>
                            <TableCell>
                              <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', mr: 1, bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              {c.categoryName}
                            </TableCell>
                            <TableCell align="right">{formatMoney(c.total)}</TableCell>
                            <TableCell align="right">{c.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );
}

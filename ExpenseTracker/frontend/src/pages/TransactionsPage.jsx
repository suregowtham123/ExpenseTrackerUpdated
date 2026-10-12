import { useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { getCategories } from '../api/categories';
import { getErrorMessage } from '../api/client';
import { deleteTransaction, getTransactions } from '../api/transactions';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import { ErrorAlert } from '../components/StateViews';
import { useSettings } from '../context/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate, toDateOnly } from '../utils/format';

const EMPTY_FILTERS = { search: '', categoryId: '', type: '', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' };

const COLUMNS = [
  { id: 'date', label: 'Date', sortable: true },
  { id: 'title', label: 'Title', sortable: true },
  { id: 'category', label: 'Category', sortable: true },
  { id: 'type', label: 'Type', sortable: true },
  { id: 'amount', label: 'Amount', sortable: true, align: 'right' },
];

export default function TransactionsPage() {
  const { formatMoney, rowsPerPage } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(rowsPerPage);
  const [toast, setToast] = useState(location.state?.message ?? null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const debouncedSearch = useDebounce(filters.search, 400);

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      type: filters.type || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      minAmount: filters.minAmount !== '' ? Number(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount !== '' ? Number(filters.maxAmount) : undefined,
      sortBy,
      sortDir,
      page: page + 1,
      pageSize,
    }),
    [debouncedSearch, filters, sortBy, sortDir, page, pageSize],
  );

  const { data, loading, error, reload } = useAsync(() => getTransactions(query), [query]);
  const { data: categories } = useAsync(() => getCategories(), []);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir(column === 'title' || column === 'category' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteTransaction(toDelete.transactionId);
      setToast('Transaction deleted');
      setToDelete(null);
      // Step back a page if we just removed the last row on this page
      if (data && data.items.length === 1 && page > 0) setPage(page - 1);
      else reload();
    } catch (e) {
      setActionError(getErrorMessage(e));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Search, filter, sort and manage your income and expenses"
        action={
          <Button component={RouterLink} to="/transactions/new" variant="contained" startIcon={<AddIcon />}>
            Add transaction
          </Button>
        }
      />

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField label="Search title or notes" size="small" fullWidth value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField select label="Type" size="small" fullWidth value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Income">Income</MenuItem>
                <MenuItem value="Expense">Expense</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField select label="Category" size="small" fullWidth value={filters.categoryId} onChange={(e) => updateFilter('categoryId', e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {(categories ?? []).map((c) => (
                  <MenuItem key={c.categoryId} value={String(c.categoryId)}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField label="Min amount" type="number" size="small" fullWidth value={filters.minAmount} onChange={(e) => updateFilter('minAmount', e.target.value)} inputProps={{ min: 0 }} />
                <TextField label="Max amount" type="number" size="small" fullWidth value={filters.maxAmount} onChange={(e) => updateFilter('maxAmount', e.target.value)} inputProps={{ min: 0 }} />
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField label="From" type="date" size="small" fullWidth value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField label="To" type="date" size="small" fullWidth value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button disabled={!hasFilters} onClick={() => { setFilters(EMPTY_FILTERS); setPage(0); }}>
                Clear filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <ErrorAlert message={error} onRetry={reload} />}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
        <TableContainer>
          <Table size="medium" aria-label="Transactions table">
            <TableHead>
              <TableRow>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id} align={col.align} sortDirection={sortBy === col.id ? sortDir : false}>
                    <TableSortLabel active={sortBy === col.id} direction={sortBy === col.id ? sortDir : 'asc'} onClick={() => handleSort(col.id)}>
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.items ?? []).map((t) => (
                <TableRow key={t.transactionId} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/${t.transactionId}`)}>
                  <TableCell>{formatDate(toDateOnly(t.date))}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.categoryName}</TableCell>
                  <TableCell>
                    <Chip size="small" label={t.type} color={t.type === 'Income' ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: t.type === 'Income' ? 'success.main' : 'error.main' }}>
                    {t.type === 'Income' ? '+' : '−'} {formatMoney(t.amount)}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <IconButton aria-label={`Edit ${t.title}`} component={RouterLink} to={`/transactions/${t.transactionId}`} state={{ edit: true }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton aria-label={`Delete ${t.title}`} onClick={() => setToDelete(t)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No transactions match your filters.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.totalCount ?? 0}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
        />
      </Paper>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete transaction?"
        message={toDelete ? `"${toDelete.title}" (${formatMoney(toDelete.amount)}) will be permanently deleted.` : ''}
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => confirmDelete()}
      />
      <Snackbar open={toast !== null} autoHideDuration={3500} onClose={() => setToast(null)} message={toast ?? ''} />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { createBudget, deleteBudget, getBudgets, updateBudget } from '../api/budgets';
import { getCategories } from '../api/categories';
import { getErrorMessage } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import { ErrorAlert, LoadingState } from '../components/StateViews';
import { useSettings } from '../context/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { budgetColor } from '../utils/budget';
import { monthLabel, parseMonthInput, toMonthInput } from '../utils/format';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  limitAmount: z
    .string()
    .trim()
    .min(1, 'Limit is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimals)')
    .refine((v) => Number(v) > 0, 'Limit must be greater than 0'),
});
function BudgetDialog({ open, budget, categories, month, year, onClose, onSaved }) {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: { categoryId: '', limitAmount: '' },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      reset({
        categoryId: budget ? String(budget.categoryId) : '',
        limitAmount: budget ? String(budget.limitAmount) : '',
      });
    }
  }, [open, budget, reset]);

  const submit = handleSubmit(async (values) => {
    setSaving(true);
    setError(null);
    const input = { categoryId: Number(values.categoryId), month, year, limitAmount: Number(values.limitAmount) };
    try {
      if (budget) await updateBudget(budget.budgetId, input);
      else await createBudget(input);
      onSaved(budget ? 'Budget updated' : 'Budget created');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  });

  const cat = register('categoryId');
  const limit = register('limitAmount');

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{budget ? 'Edit budget' : 'New budget'} · {monthLabel(year, month)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Category"
            select
            fullWidth
            disabled={Boolean(budget)}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            name={cat.name}
            onChange={cat.onChange}
            onBlur={cat.onBlur}
            inputRef={cat.ref}
            error={Boolean(errors.categoryId)}
            helperText={errors.categoryId?.message}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={String(c.categoryId)}>
                {c.name}
              </option>
            ))}
          </TextField>
          <TextField
            label="Monthly limit"
            fullWidth
            inputProps={{ inputMode: 'decimal' }}
            name={limit.name}
            onChange={limit.onChange}
            onBlur={limit.onBlur}
            inputRef={limit.ref}
            error={Boolean(errors.limitAmount)}
            helperText={errors.limitAmount?.message}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => submit()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BudgetsPage() {
  const { formatMoney } = useSettings();
  const [period, setPeriod] = useState(() => toMonthInput(new Date()));
  const parsed = useMemo(() => parseMonthInput(period) ?? parseMonthInput(toMonthInput(new Date())), [period]);

  const { data: budgets, loading, error, reload } = useAsync(() => getBudgets(parsed.month, parsed.year), [parsed.month, parsed.year]);
  const { data: categories } = useAsync(() => getCategories(), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionError, setActionError] = useState(null);

  const availableCategories = useMemo(() => {
    const used = new Set((budgets ?? []).map((b) => b.categoryId));
    return (categories ?? []).filter((c) => c.type === 'Expense' && (editing ? c.categoryId === editing.categoryId : !used.has(c.categoryId)));
  }, [categories, budgets, editing]);

  const totals = useMemo(() => {
    const list = budgets ?? [];
    return { limit: list.reduce((s, b) => s + b.limitAmount, 0), spent: list.reduce((s, b) => s + b.spent, 0) };
  }, [budgets]);
  const exceeded = (budgets ?? []).filter((b) => b.isExceeded);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteBudget(toDelete.budgetId);
      setToast('Budget deleted');
      reload();
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Set monthly limits per category and track your spending"
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New budget
            </Button>
          </Stack>
        }
      />

      {error && <ErrorAlert message={error} onRetry={reload} />}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {!budgets && loading && <LoadingState />}

      {exceeded.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2.5 }}>
          Over budget: {exceeded.map((b) => `${b.categoryName} (+${formatMoney(Math.abs(b.remaining))})`).join(', ')}
        </Alert>
      )}

      {budgets && budgets.length > 0 && (
        <Card sx={{ mb: 2.5 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography fontWeight={600}>Total for {monthLabel(parsed.year, parsed.month)}</Typography>
              <Typography>
                {formatMoney(totals.spent)} of {formatMoney(totals.limit)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={totals.limit > 0 ? Math.min((totals.spent / totals.limit) * 100, 100) : 0}
              color={budgetColor(totals.limit > 0 ? (totals.spent / totals.limit) * 100 : 0)}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </CardContent>
        </Card>
      )}

      {budgets && budgets.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No budgets for {monthLabel(parsed.year, parsed.month)} yet.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Create your first budget
            </Button>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2.5}>
        {(budgets ?? []).map((b) => (
          <Grid item xs={12} sm={6} md={4} key={b.budgetId}>
            <Card sx={{ height: '100%', borderColor: b.isExceeded ? 'error.main' : undefined }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{b.categoryName}</Typography>
                  <Box>
                    <Tooltip title="Edit limit">
                      <IconButton size="small" aria-label={`Edit ${b.categoryName} budget`} onClick={() => openEdit(b)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" aria-label={`Delete ${b.categoryName} budget`} onClick={() => setToDelete(b)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Stack>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formatMoney(b.spent)}
                  <Typography component="span" color="text.secondary">
                    {' '}
                    / {formatMoney(b.limitAmount)}
                  </Typography>
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(b.percentUsed, 100)}
                  color={budgetColor(b.percentUsed)}
                  sx={{ height: 8, borderRadius: 4, my: 1.5 }}
                />
                <Typography variant="body2" color={b.isExceeded ? 'error.main' : 'text.secondary'}>
                  {b.isExceeded
                    ? `Over budget by ${formatMoney(Math.abs(b.remaining))} (${b.percentUsed}%)`
                    : `${formatMoney(b.remaining)} remaining (${b.percentUsed}% used)`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <BudgetDialog
        open={dialogOpen}
        budget={editing}
        categories={availableCategories}
        month={parsed.month}
        year={parsed.year}
        onClose={() => setDialogOpen(false)}
        onSaved={(message) => {
          setDialogOpen(false);
          setToast(message);
          reload();
        }}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete budget?"
        message={toDelete ? `The ${toDelete.categoryName} budget for ${monthLabel(toDelete.year, toDelete.month)} will be removed.` : ''}
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => confirmDelete()}
      />
      <Snackbar open={toast !== null} autoHideDuration={3500} onClose={() => setToast(null)} message={toast ?? ''} />
    </>
  );
}

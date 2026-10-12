import { useEffect, useState } from 'react';
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
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../api/categories';
import { getErrorMessage } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import { ErrorAlert, LoadingState } from '../components/StateViews';
import { useSettings } from '../context/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { CURRENCIES } from '../utils/format';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long (max 100)'),
  type: z.enum(['Income', 'Expense']),
});
function CategoryDialog({ open, category, onClose, onSaved }) {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: 'Expense' },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      reset({ name: category?.name ?? '', type: category?.type ?? 'Expense' });
    }
  }, [open, category, reset]);

  const submit = handleSubmit(async (values) => {
    setSaving(true);
    setError(null);
    try {
      if (category) await updateCategory(category.categoryId, values);
      else await createCategory(values);
      onSaved(category ? 'Category updated' : 'Category created');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  });

  const name = register('name');
  const type = register('type');

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Name"
            fullWidth
            name={name.name}
            onChange={name.onChange}
            onBlur={name.onBlur}
            inputRef={name.ref}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />
          <TextField
            label="Type"
            select
            fullWidth
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            name={type.name}
            onChange={type.onChange}
            onBlur={type.onBlur}
            inputRef={type.ref}
            error={Boolean(errors.type)}
            helperText={errors.type?.message}
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </TextField>
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

function CategoryList({
  title,
  type,
  categories,
  onEdit,
  onDelete,
}) {
  const items = categories.filter((c) => c.type === type);
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      <List dense>
        {items.map((c) => (
          <ListItem
            key={c.categoryId}
            disableGutters
            secondaryAction={
              <>
                <IconButton size="small" aria-label={`Edit category ${c.name}`} onClick={() => onEdit(c)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label={`Delete category ${c.name}`} onClick={() => onDelete(c)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            }
          >
            <ListItemText primary={c.name} />
          </ListItem>
        ))}
        {items.length === 0 && <Typography color="text.secondary">No categories yet.</Typography>}
      </List>
    </Box>
  );
}

export default function SettingsPage() {
  const { currency, themeMode, rowsPerPage, updateSettings, formatMoney } = useSettings();
  const { data: categories, loading, error, reload } = useAsync(() => getCategories(), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionError, setActionError] = useState(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteCategory(toDelete.categoryId);
      setToast('Category deleted');
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
      <PageHeader title="Settings" subtitle="Preferences are stored in this browser. No account is needed." />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferences
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  select
                  label="Currency"
                  value={currency}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                  helperText={`Preview: ${formatMoney(123456.78)}`}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Rows per page (transactions)"
                  value={rowsPerPage}
                  onChange={(e) => updateSettings({ rowsPerPage: Number(e.target.value) })}
                >
                  {[5, 10, 25, 50].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </TextField>
                <FormControlLabel
                  control={<Switch checked={themeMode === 'dark'} onChange={(e) => updateSettings({ themeMode: e.target.checked ? 'dark' : 'light' })} />}
                  label="Dark mode"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Categories</Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  New category
                </Button>
              </Stack>

              {error && <ErrorAlert message={error} onRetry={reload} />}
              {actionError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                  {actionError}
                </Alert>
              )}
              {!categories && loading && <LoadingState />}
              {categories && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <CategoryList title="Expense" type="Expense" categories={categories} onEdit={(c) => { setEditing(c); setDialogOpen(true); }} onDelete={setToDelete} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CategoryList title="Income" type="Income" categories={categories} onEdit={(c) => { setEditing(c); setDialogOpen(true); }} onDelete={setToDelete} />
                  </Grid>
                </Grid>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Categories that are used by transactions or budgets cannot be deleted.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <CategoryDialog
        open={dialogOpen}
        category={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={(message) => {
          setDialogOpen(false);
          setToast(message);
          reload();
        }}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete category?"
        message={toDelete ? `"${toDelete.name}" will be deleted.` : ''}
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => confirmDelete()}
      />
      <Snackbar open={toast !== null} autoHideDuration={3500} onClose={() => setToast(null)} message={toast ?? ''} />
    </>
  );
}

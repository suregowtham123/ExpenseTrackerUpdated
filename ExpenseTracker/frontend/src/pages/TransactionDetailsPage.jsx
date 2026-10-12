import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { getCategories } from '../api/categories';
import { getErrorMessage } from '../api/client';
import { deleteTransaction, getTransaction, updateTransaction } from '../api/transactions';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import { ErrorAlert, LoadingState } from '../components/StateViews';
import TransactionForm from '../components/TransactionForm';
import { useSettings } from '../context/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { formatDate, toDateOnly } from '../utils/format';

function DetailRow({ label, children }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 2 }} sx={{ py: 1.25 }}>
      <Typography color="text.secondary" sx={{ width: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

export default function TransactionDetailsPage() {
  const { id } = useParams();
  const transactionId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { formatMoney } = useSettings();

  const [editing, setEditing] = useState(Boolean(location.state?.edit));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const validId = Number.isInteger(transactionId) && transactionId > 0;
  const { data: transaction, error, loading, reload } = useAsync(
    () => (validId ? getTransaction(transactionId) : Promise.reject(new Error('Invalid transaction id.'))),
    [transactionId],
  );
  const { data: categories } = useAsync(() => getCategories(), []);

  const handleUpdate = async (input) => {
    setBusy(true);
    setActionError(null);
    try {
      await updateTransaction(transactionId, input);
      setEditing(false);
      reload();
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteTransaction(transactionId);
      navigate('/transactions', { state: { message: 'Transaction deleted' } });
    } catch (e) {
      setActionError(getErrorMessage(e));
      setConfirmOpen(false);
      setBusy(false);
    }
  };

  return (
    <>
      <Button component={RouterLink} to="/transactions" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
        All transactions
      </Button>
      <PageHeader title={editing ? 'Edit transaction' : 'Transaction details'} />

      {error && <ErrorAlert message={error} onRetry={validId ? reload : undefined} />}
      {loading && !transaction && !error && <LoadingState />}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      {transaction && (
        <Card sx={{ maxWidth: 720 }}>
          <CardContent>
            {editing && categories ? (
              <TransactionForm
                categories={categories}
                submitting={busy}
                submitLabel="Save changes"
                initialValues={{
                  title: transaction.title,
                  amount: String(transaction.amount),
                  type: transaction.type,
                  categoryId: String(transaction.categoryId),
                  date: toDateOnly(transaction.date),
                  notes: transaction.notes ?? '',
                }}
                onSubmit={handleUpdate}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <Typography variant="h5" component="h2" gutterBottom>
                  {transaction.title}
                </Typography>
                <Divider />
                <DetailRow label="Amount">
                  <Typography fontWeight={700} color={transaction.type === 'Income' ? 'success.main' : 'error.main'}>
                    {transaction.type === 'Income' ? '+' : '−'} {formatMoney(transaction.amount)}
                  </Typography>
                </DetailRow>
                <DetailRow label="Type">
                  <Chip size="small" label={transaction.type} color={transaction.type === 'Income' ? 'success' : 'error'} variant="outlined" />
                </DetailRow>
                <DetailRow label="Category">{transaction.categoryName}</DetailRow>
                <DetailRow label="Date">{formatDate(toDateOnly(transaction.date))}</DetailRow>
                <DetailRow label="Notes">{transaction.notes ?? <Typography color="text.secondary">—</Typography>}</DetailRow>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmOpen(true)}>
                    Delete
                  </Button>
                  <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete transaction?"
        message="This transaction will be permanently deleted."
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => handleDelete()}
      />
    </>
  );
}

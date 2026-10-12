import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, CardContent } from '@mui/material';
import { getCategories } from '../api/categories';
import { getErrorMessage } from '../api/client';
import { createTransaction } from '../api/transactions';
import PageHeader from '../components/PageHeader';
import { ErrorAlert, LoadingState } from '../components/StateViews';
import TransactionForm from '../components/TransactionForm';
import { useAsync } from '../hooks/useAsync';

export default function TransactionNewPage() {
  const navigate = useNavigate();
  const { data: categories, error, reload } = useAsync(() => getCategories(), []);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (input) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createTransaction(input);
      navigate('/transactions', { state: { message: 'Transaction added' } });
    } catch (e) {
      setSubmitError(getErrorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Add transaction" subtitle="Record a new income or expense" />
      {error && <ErrorAlert message={error} onRetry={reload} />}
      {!categories && !error && <LoadingState />}
      {categories && (
        <Card sx={{ maxWidth: 720 }}>
          <CardContent>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            <TransactionForm
              categories={categories}
              submitting={submitting}
              submitLabel="Add transaction"
              onSubmit={handleSubmit}
              onCancel={() => navigate('/transactions')}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}

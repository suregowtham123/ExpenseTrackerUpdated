import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, TextField } from '@mui/material';
import { toDateInput } from '../utils/format';
import { transactionSchema } from './transactionSchema';

export default function TransactionForm({
  categories,
  initialValues,
  submitLabel = 'Save transaction',
  submitting = false,
  onSubmit,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      title: '',
      amount: '',
      type: 'Expense',
      categoryId: '',
      date: toDateInput(new Date()),
      notes: '',
      ...initialValues,
    },
  });

  const selectedType = watch('type');
  const visibleCategories = useMemo(() => categories.filter((c) => c.type === selectedType), [categories, selectedType]);

  // react-hook-form's register() returns a `ref`; MUI needs it on the inner input element.
  const field = (name, extra) => {
    const { ref, ...rest } = register(name, extra);
    return { ...rest, inputRef: ref, error: Boolean(errors[name]), helperText: errors[name]?.message };
  };

  const submit = handleSubmit((values) =>
    onSubmit({
      title: values.title.trim(),
      amount: Number(values.amount),
      type: values.type,
      categoryId: Number(values.categoryId),
      date: values.date,
      notes: values.notes.trim() === '' ? null : values.notes.trim(),
    }),
  );

  return (
    <Box component="div" role="form" aria-label="Transaction form">
      <Stack spacing={2.5}>
        <TextField label="Title" fullWidth {...field('title')} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Amount" fullWidth inputProps={{ inputMode: 'decimal' }} {...field('amount')} />
          <TextField
            label="Type"
            select
            fullWidth
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            {...field('type', { onChange: () => setValue('categoryId', '') })}
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Category" select fullWidth SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} {...field('categoryId')}>
            <option value="">Select a category</option>
            {visibleCategories.map((c) => (
              <option key={c.categoryId} value={String(c.categoryId)}>
                {c.name}
              </option>
            ))}
          </TextField>
          <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...field('date')} />
        </Stack>

        <TextField label="Notes (optional)" fullWidth multiline minRows={2} {...field('notes')} />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {onCancel && (
            <Button onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button variant="contained" onClick={() => submit()} disabled={submitting}>
            {submitting ? 'Saving…' : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

import { z } from 'zod';

/** Form values are kept as strings (native inputs); they are converted before calling the API. */
export const transactionSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200, 'Title is too long (max 200)'),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimals)')
    .refine((v) => Number(v) > 0, 'Amount must be greater than 0'),
  type: z.enum(['Income', 'Expense']),
  categoryId: z.string().min(1, 'Select a category'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(1000, 'Notes are too long (max 1000)'),
});

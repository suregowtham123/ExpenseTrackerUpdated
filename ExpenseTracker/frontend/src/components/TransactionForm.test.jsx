import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from './TransactionForm';

const categories = [
  { categoryId: 1, name: 'Food', type: 'Expense' },
  { categoryId: 2, name: 'Travel', type: 'Expense' },
  { categoryId: 7, name: 'Salary', type: 'Income' },
];

describe('TransactionForm', () => {
  it('shows validation errors when submitted empty', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm categories={categories} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /save transaction/i }));

    expect(await screen.findByText(/title must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    expect(screen.getByText(/select a category/i, { selector: 'p' })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an amount of zero', async () => {
    render(<TransactionForm categories={categories} onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/title/i), 'Lunch');
    await userEvent.type(screen.getByLabelText(/amount/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /save transaction/i }));

    expect(await screen.findByText(/amount must be greater than 0/i)).toBeInTheDocument();
  });

  it('only lists categories that match the selected type', async () => {
    render(<TransactionForm categories={categories} onSubmit={vi.fn()} />);

    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Salary' })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/^type/i), 'Income');

    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Food' })).not.toBeInTheDocument();
  });

  it('submits converted values when the form is valid', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm categories={categories} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/title/i), '  Lunch  ');
    await userEvent.type(screen.getByLabelText(/amount/i), '250.50');
    await userEvent.selectOptions(screen.getByLabelText(/category/i), '1');
    await userEvent.click(screen.getByRole('button', { name: /save transaction/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Lunch', amount: 250.5, type: 'Expense', categoryId: 1, notes: null }),
    );
  });
});

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Plus, Trash2 } from 'lucide-react';

const journalLineSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  description: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  contactId: z.string().optional(),
});

const journalEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  lines: z.array(journalLineSchema).min(2, 'At least two lines are required'),
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

interface CreateJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
}

export function CreateJournalEntryModal({ isOpen, onClose, entityId }: CreateJournalEntryModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ['accounts', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/accounts', {
        headers: { 'x-entity-id': entityId }
      });
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
    enabled: isOpen && !!entityId
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/contacts', {
        headers: { 'x-entity-id': entityId }
      });
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    enabled: isOpen && !!entityId
  });

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      lines: [
        { accountId: '', description: '', debit: 0, credit: 0 },
        { accountId: '', description: '', debit: 0, credit: 0 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const lines = watch('lines');
  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const mutation = useMutation({
    mutationFn: async (data: JournalEntryFormData) => {
      if (!isBalanced) throw new Error('Journal entry must be balanced');
      
      const res = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-entity-id': entityId,
        },
        body: JSON.stringify({
          ...data,
          sourceType: 'MANUAL',
          sourceId: 'manual',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create journal entry');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', entityId] });
      reset();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const onSubmit = (data: JournalEntryFormData) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Journal Entry" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <input
              {...register('description')}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Monthly rent"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
        </div>

        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="px-4 py-2 w-1/3">Account</th>
                <th className="px-4 py-2 w-1/4">Description</th>
                <th className="px-4 py-2 w-1/6">Contact (Opt)</th>
                <th className="px-4 py-2 w-32 text-right">Debit</th>
                <th className="px-4 py-2 w-32 text-right">Credit</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {fields.map((field, index) => (
                <tr key={field.id} className="bg-white">
                  <td className="p-2">
                    <select
                      {...register(`lines.${index}.accountId`)}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select account...</option>
                      {Array.isArray(accounts) && accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                    {errors.lines?.[index]?.accountId && (
                      <p className="text-red-500 text-xs mt-1">{errors.lines[index]?.accountId?.message}</p>
                    )}
                  </td>
                  <td className="p-2">
                    <input
                      {...register(`lines.${index}.description`)}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Line description"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      {...register(`lines.${index}.contactId`)}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">None</option>
                      {Array.isArray(contacts) && contacts.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`lines.${index}.debit`, { valueAsNumber: true })}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`lines.${index}.credit`, { valueAsNumber: true })}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 border-t border-zinc-200">
              <tr>
                <td colSpan={3} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => append({ accountId: '', description: '', debit: 0, credit: 0 })}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                  ${totalDebit.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                  ${totalCredit.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
          <p className="text-red-500 text-sm text-right">
            Debits and credits must equal. Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)}
          </p>
        )}

        <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isBalanced}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Journal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

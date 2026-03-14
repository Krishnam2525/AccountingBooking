import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { Plus, Trash2, X } from 'lucide-react';

// Simplified schema for the frontend form
const FormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  lines: z.array(z.object({
    accountId: z.string().min(1, 'Account is required'),
    description: z.string().optional(),
    debit: z.number().min(0),
    credit: z.number().min(0),
  })).min(2, 'At least two lines are required')
}).refine(data => {
  const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, {
  message: "Total debits must equal total credits",
  path: ["lines"]
}).refine(data => {
  return data.lines.every(line => {
    const hasDebit = (line.debit || 0) > 0;
    const hasCredit = (line.credit || 0) > 0;
    return !(hasDebit && hasCredit);
  });
}, {
  message: "A single line cannot have both a debit and a credit",
  path: ["lines"]
});

type FormValues = z.infer<typeof FormSchema>;

export function JournalEntryForm({ onClose }: { onClose: () => void }) {
  const { currentEntity } = useAppStore();
  const queryClient = useQueryClient();
  const entityId = currentEntity?.id || '';

  const { data: accounts } = useQuery({
    queryKey: ['accounts', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/accounts', {
        headers: { 'x-entity-id': entityId }
      });
      return res.json();
    },
    enabled: !!entityId
  });

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  });

  const watchLines = watch("lines");
  const totalDebit = watchLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = watchLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-entity-id': entityId 
        },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
          sourceType: 'MANUAL',
          sourceId: 'manual',
          postImmediately: true
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create entry');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', entityId] });
      onClose();
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">New Journal Entry</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
              <input 
                type="date" 
                {...register('date')}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <input 
                type="text" 
                {...register('description')}
                placeholder="Entry description..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700">Lines</label>
              <button 
                type="button"
                onClick={() => append({ accountId: '', debit: 0, credit: 0 })}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Line
              </button>
            </div>
            
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 w-1/3">Account</th>
                    <th className="px-4 py-2 w-1/3">Description</th>
                    <th className="px-4 py-2 w-1/6 text-right">Debit</th>
                    <th className="px-4 py-2 w-1/6 text-right">Credit</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="px-4 py-2">
                        <select 
                          {...register(`lines.${index}.accountId`)}
                          className="w-full px-2 py-1.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select account...</option>
                          {accounts?.map((acc: any) => (
                            <option key={acc.id} value={acc.id} disabled={acc.isControl}>
                              {acc.code} - {acc.name} {acc.isControl ? '(Control)' : ''}
                            </option>
                          ))}
                        </select>
                        {errors.lines?.[index]?.accountId && <p className="text-red-500 text-xs mt-1">{errors.lines[index]?.accountId?.message}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          {...register(`lines.${index}.description`)}
                          placeholder="Line description..."
                          className="w-full px-2 py-1.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          {...register(`lines.${index}.debit`, { valueAsNumber: true })}
                          className="w-full px-2 py-1.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          {...register(`lines.${index}.credit`, { valueAsNumber: true })}
                          className="w-full px-2 py-1.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          type="button"
                          onClick={() => remove(index)}
                          className="text-zinc-400 hover:text-red-500"
                          disabled={fields.length <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50 border-t border-zinc-200 font-medium">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-zinc-600">Total</td>
                    <td className="px-4 py-3 text-right text-zinc-900">${totalDebit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-zinc-900">${totalCredit.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {errors.lines?.root && (
              <p className="text-red-500 text-sm mt-2 font-medium">{errors.lines.root.message}</p>
            )}
            {mutation.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {mutation.error.message}
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3 rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending || !isBalanced || totalDebit === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Posting...' : 'Post Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Plus, Trash2 } from 'lucide-react';

const billLineSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0).default(0),
  accountId: z.string().min(1, 'Account is required'),
});

const billSchema = z.object({
  contactId: z.string().min(1, 'Vendor is required'),
  date: z.string().min(1, 'Date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  reference: z.string().optional(),
  lines: z.array(billLineSchema).min(1, 'At least one line is required'),
});

type BillFormData = z.infer<typeof billSchema>;

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
}

export function CreateBillModal({ isOpen, onClose, entityId }: CreateBillModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

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

  const vendors = Array.isArray(contacts) ? contacts.filter((c: any) => c.type === 'VENDOR' || c.type === 'BOTH') : [];
  const expenseAccounts = Array.isArray(accounts) ? accounts.filter((a: any) => a.type === 'EXPENSE' || a.type === 'ASSET') : [];

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reference: '',
      lines: [
        { description: '', quantity: 1, unitPrice: 0, accountId: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const lines = watch('lines');
  const total = lines.reduce((sum, line) => sum + ((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)), 0);

  const mutation = useMutation({
    mutationFn: async (data: BillFormData) => {
      const res = await fetch('/api/accounting/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-entity-id': entityId,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create bill');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', entityId] });
      reset();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const onSubmit = (data: BillFormData) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Bill" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Vendor</label>
            <select
              {...register('contactId')}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select vendor...</option>
              {vendors.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.contactId && <p className="text-red-500 text-xs mt-1">{errors.contactId.message}</p>}
          </div>
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
            <label className="block text-sm font-medium text-zinc-700 mb-1">Due Date</label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Reference (e.g. Vendor Invoice #)</label>
          <input
            type="text"
            {...register('reference')}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="INV-2023-001"
          />
        </div>

        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="px-4 py-2 w-1/3">Description</th>
                <th className="px-4 py-2 w-1/4">Account</th>
                <th className="px-4 py-2 w-24 text-right">Qty</th>
                <th className="px-4 py-2 w-32 text-right">Price</th>
                <th className="px-4 py-2 w-32 text-right">Amount</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {fields.map((field, index) => {
                const qty = Number(lines[index]?.quantity) || 0;
                const price = Number(lines[index]?.unitPrice) || 0;
                const amount = qty * price;

                return (
                  <tr key={field.id} className="bg-white">
                    <td className="p-2">
                      <input
                        {...register(`lines.${index}.description`)}
                        className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Item description"
                      />
                      {errors.lines?.[index]?.description && (
                        <p className="text-red-500 text-xs mt-1">{errors.lines[index]?.description?.message}</p>
                      )}
                    </td>
                    <td className="p-2">
                      <select
                        {...register(`lines.${index}.accountId`)}
                        className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select account...</option>
                        {expenseAccounts.map((acc: any) => (
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
                        type="number"
                        min="1"
                        {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                        className="w-full px-2 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-mono text-zinc-700">
                      ${amount.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-50 border-t border-zinc-200">
              <tr>
                <td colSpan={4} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => append({ description: '', quantity: 1, unitPrice: 0, accountId: '' })}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                  ${total.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

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
            disabled={isSubmitting || total === 0}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

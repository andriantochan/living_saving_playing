'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase' // Use relative import if alias not working, but @/ should work
import { Loader2, Plus, Save, X } from 'lucide-react'
import { cn } from '../lib/utils'

type Expense = {
    id: string
    amount: number
    category: 'Living' | 'Playing' | 'Saving' | 'Income'
    description: string
    date: string
}

export function ExpenseForm({ onAddExpense, initialData, onCancel }: { onAddExpense: () => void, initialData?: Expense | null, onCancel?: () => void }) {
    const [amount, setAmount] = useState(initialData ? initialData.amount.toLocaleString('id-ID', { useGrouping: true }).replace(/,/g, '.') : '')
    const [category, setCategory] = useState<'Living' | 'Playing' | 'Saving' | 'Income'>(initialData ? initialData.category : 'Living')
    const [description, setDescription] = useState(initialData ? initialData.description : '')
    const [date, setDate] = useState(initialData ? initialData.date : '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const cleanAmount = amount.replace(/\./g, '')
        if (!amount || isNaN(Number(cleanAmount))) {
            setError('Please enter a valid amount')
            setLoading(false)
            return
        }

        try {
            // We use the client-side supabase client here for simplicity in this prototype
            // In a real app, we might use Server Actions

            if (initialData) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('expenses')
                    .update({
                        amount: Number(amount.replace(/\./g, '')),
                        category,
                        description,
                        date: date ? new Date(date).toISOString() : new Date().toISOString()
                    })
                    .eq('id', initialData.id)

                if (updateError) throw updateError
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('expenses')
                    .insert([
                        {
                            amount: Number(amount.replace(/\./g, '')),
                            category,
                            description,
                            date: date ? new Date(date).toISOString() : new Date().toISOString()
                        }
                    ])

                if (insertError) throw insertError
            }

            setAmount('')
            setDescription('')
            setDate('')
            // Trigger refresh
            onAddExpense()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{initialData ? 'Edit Expense' : 'Add New Expense'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['Living', 'Playing', 'Saving', 'Income'].map((cat) => (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => setCategory(cat as any)}
                                className={cn(
                                    "py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors border truncate",
                                    category === cat
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {category === 'Living' && "Necessities: Food, rent, utilities, transport."}
                        {category === 'Playing' && "Wants: Hobby, games, vacation, dining out."}
                        {category === 'Saving' && "Future: Investments, emergency fund, savings."}
                        {category === 'Income' && "Inflow: Salary, bonus, side hustle, gifts."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (IDR)</label>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '')
                                const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                setAmount(formatted)
                            }}
                            placeholder="e.g. 50.000"
                            className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Steam Wallet, Nasi Goreng"
                            className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date (Optional)</label>
                    <input
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use current time.</p>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                        "w-full flex items-center justify-center text-white font-medium py-2.5 rounded-lg transition-all focus:ring-4 disabled:opacity-70",
                        initialData
                            ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200"
                            : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200"
                    )}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : initialData ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {initialData ? 'Update Transaction' : 'Add Transaction'}
                </button>
            </form>
        </div>
    )
}

'use client'

import { format } from 'date-fns' // You might need to install date-fns or just use native Date
import { Home, Gamepad2, PiggyBank, Trash2, Pencil, Banknote } from 'lucide-react'
import { supabase } from '../lib/supabase' // Use global Client for deletion
import { useState, useMemo } from 'react'
import { cn } from '../lib/utils'

type Expense = {
    id: string
    amount: number
    category: 'Living' | 'Playing' | 'Saving' | 'Income'
    description: string
    date: string
    project_id?: string
    user_id?: string
    profiles?: any
}

export function ExpenseList({ expenses, onDelete, onEdit }: { expenses: Expense[], onDelete: () => void, onEdit: (expense: Expense) => void }) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filterCategory, setFilterCategory] = useState<'All' | 'Living' | 'Playing' | 'Saving' | 'Income'>('All')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

    const filteredExpenses = useMemo(() => {
        let result = [...expenses]

        // Filter
        if (filterCategory !== 'All') {
            result = result.filter(exp => exp.category === filterCategory)
        }

        // Sort
        result.sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.date).getTime() - new Date(a.date).getTime()
                case 'oldest':
                    return new Date(a.date).getTime() - new Date(b.date).getTime()
                case 'highest':
                    return b.amount - a.amount
                case 'lowest':
                    return a.amount - b.amount
                default:
                    return 0
            }
        })

        return result
    }, [expenses, filterCategory, sortOrder])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        setDeletingId(id)
        try {
            // We use the client-side supabase client here for simplicity in this prototype

            const { error } = await supabase.from('expenses').delete().eq('id', id)
            if (error) throw error
            onDelete()
        } catch (error) {
            console.error('Error deleting:', error)
            alert('Failed to delete expense')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Transactions</h3>
                <div className="flex gap-2">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as any)}
                        className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        <option value="All">All Categories</option>
                        <option value="Income">Income</option>
                        <option value="Living">Living</option>
                        <option value="Playing">Playing</option>
                        <option value="Saving">Saving</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highest">Highest Amount</option>
                        <option value="lowest">Lowest Amount</option>
                    </select>
                </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredExpenses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No expenses recorded yet. Start by adding one!
                    </div>
                ) : (
                    filteredExpenses.map((expense) => {
                        const isIncome = expense.category === 'Income';
                        const isLiving = expense.category === 'Living';
                        const isPlaying = expense.category === 'Playing';
                        const isSaving = expense.category === 'Saving';

                        return (
                            <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        isIncome ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                            isLiving ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                                isPlaying ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                                    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    )}>
                                        {isIncome && <Banknote className="w-5 h-5" />}
                                        {isLiving && <Home className="w-5 h-5" />}
                                        {isPlaying && <Gamepad2 className="w-5 h-5" />}
                                        {isSaving && <PiggyBank className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{expense.description}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(expense.date), 'MMM d, yyyy')} • {expense.category}
                                            {expense.profiles && (
                                                <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                                                    Added by {expense.profiles.full_name || expense.profiles.username || 'Unknown'}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "font-semibold",
                                        isIncome ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                                    )}>
                                        {isIncome ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(expense.amount)}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            disabled={deletingId === expense.id}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    )
}

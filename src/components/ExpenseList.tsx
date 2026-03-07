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
    sub_category?: string
    description: string
    date: string
    source?: 'Balance' | 'Saving' | 'Credit Card'
    project_id?: string
    user_id?: string
    profiles?: any
}

export function ExpenseList({ expenses, onDelete, onEdit }: { expenses: Expense[], onDelete: () => void, onEdit: (expense: Expense) => void }) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filterCategory, setFilterCategory] = useState<'All' | 'Living' | 'Playing' | 'Saving' | 'Income'>('All')
    const [filterSubCategory, setFilterSubCategory] = useState<string>('All')
    const [filterUser, setFilterUser] = useState<string>('All')
    const [filterStartDate, setFilterStartDate] = useState<string>('')
    const [filterEndDate, setFilterEndDate] = useState<string>('')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

    const SUB_CATEGORIES: Record<string, string[]> = {
        Living: ['Listrik', 'Uang Kos', 'Wifi', 'Bensin', 'Makan', 'Groceries', 'Transport', 'Lainnya'],
        Playing: ['Game', 'Langganan', 'Jalan-jalan', 'Hobi', 'Lainnya'],
        Saving: ['Darurat', 'Investasi', 'Tabungan', 'Lainnya'],
        Income: ['Gaji', 'Bonus', 'Hadiah', 'Lainnya']
    }

    const uniqueUsers = useMemo(() => {
        const usersMap = new Map<string, string>()
        expenses.forEach(exp => {
            if (exp.user_id && exp.profiles) {
                const name = exp.profiles.full_name || exp.profiles.username || 'Unknown'
                usersMap.set(exp.user_id, name)
            }
        })
        return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }))
    }, [expenses])

    const filteredExpenses = useMemo(() => {
        let result = [...expenses]

        // Filter Category
        if (filterCategory !== 'All') {
            result = result.filter(exp => exp.category === filterCategory)

            // Filter Sub Category
            if (filterSubCategory !== 'All') {
                result = result.filter(exp => exp.sub_category === filterSubCategory)
            }
        }

        // Filter User
        if (filterUser !== 'All') {
            result = result.filter(exp => exp.user_id === filterUser)
        }

        // Filter Date Range
        if (filterStartDate) {
            result = result.filter(exp => exp.date >= filterStartDate)
        }
        if (filterEndDate) {
            // Include entire end date day by appending time if 'exp.date' is ISO string
            result = result.filter(exp => exp.date <= filterEndDate + 'T23:59:59')
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
    }, [expenses, filterCategory, filterSubCategory, filterUser, filterStartDate, filterEndDate, sortOrder])

    const filteredTotal = useMemo(() => {
        return filteredExpenses.reduce((total, exp) => {
            const amount = exp.category === 'Income' ? exp.amount : -exp.amount;
            return total + amount;
        }, 0);
    }, [filteredExpenses])

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
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Transactions</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                        Total: <span className={cn(
                            filteredTotal > 0 ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                        )}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Math.abs(filteredTotal))}</span>
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <select
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        <option value="All">All People</option>
                        {uniqueUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value as any)
                            setFilterSubCategory('All') // Reset sub category when parent changes
                        }}
                        className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        <option value="All">All Categories</option>
                        <option value="Income">Income</option>
                        <option value="Living">Living</option>
                        <option value="Playing">Playing</option>
                        <option value="Saving">Saving</option>
                    </select>
                    {filterCategory !== 'All' && (
                        <select
                            value={filterSubCategory}
                            onChange={(e) => setFilterSubCategory(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        >
                            <option value="All">All Sub Categories</option>
                            {SUB_CATEGORIES[filterCategory].map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    )}
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

                    <div className="flex items-center gap-1">
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            placeholder="Start Date"
                        />
                        <span className="text-gray-500 text-sm">-</span>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            placeholder="End Date"
                        />
                    </div>
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
                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                                            <span>•</span>
                                            <span>{expense.category}</span>
                                            {expense.sub_category && (
                                                <>
                                                    <span>•</span>
                                                    <span>{expense.sub_category}</span>
                                                </>
                                            )}
                                            {expense.source === 'Credit Card' && (
                                                <span className="text-[9px] uppercase tracking-wider bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800">
                                                    Credit Card
                                                </span>
                                            )}
                                            {expense.profiles && (
                                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-300">
                                                    Added by {expense.profiles.full_name || expense.profiles.username || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className={cn(
                                        "font-semibold",
                                        isIncome ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                                    )}>
                                        {isIncome ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(expense.amount)}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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

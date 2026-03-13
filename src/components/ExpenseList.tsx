'use client'

import { format } from 'date-fns' // You might need to install date-fns or just use native Date
import { Home, Gamepad2, PiggyBank, Trash2, Pencil, Banknote, ChevronDown, ChevronUp, Search } from 'lucide-react'
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
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false)
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

    const SUB_CATEGORIES: Record<string, string[]> = {
        Living: ['Makan', 'Groceries', 'Laundry', 'Wifi', 'Listrik', 'Uang Kos', 'Transport', 'Lainnya'],
        Playing: ['Fashion', 'Skincare/Makeup', 'Jalan-jalan', 'Jajan', 'Gym', 'Hobi', 'Langganan', 'Lainnya'],
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
            result = result.filter(exp => exp.date <= filterEndDate + 'T23:59:59')
        }

        // Filter Search Query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(exp => exp.description.toLowerCase().includes(query))
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
    }, [expenses, filterCategory, filterSubCategory, filterUser, filterStartDate, filterEndDate, sortOrder, searchQuery])

    const filteredTotal = useMemo(() => {
        return filteredExpenses.reduce((total, exp) => {
            const isPositiveFlow = exp.category === 'Income' || (exp.category === 'Saving' && exp.amount < 0);
            const amount = isPositiveFlow ? Math.abs(exp.amount) : -Math.abs(exp.amount);
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
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex flex-col shrink-0">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Transactions</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Total: <span className={cn(
                                filteredTotal > 0 ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                            )}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Math.abs(filteredTotal))}</span>
                        </p>
                    </div>
                </div>
                {/* Filter Controls: 2-col grid on mobile, wrap on larger screens */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-center">
                    <select
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 col-span-1"
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
                        className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 col-span-1"
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
                            className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 col-span-2 sm:col-span-1"
                        >
                            <option value="All">All Sub Categories</option>
                            {SUB_CATEGORIES[filterCategory].map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    )}
                    <div className="relative col-span-2 sm:col-span-1">
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="w-full bg-white text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-left flex justify-between items-center transition-colors"
                        >
                            <span className="truncate pr-2">
                                {filterStartDate && filterEndDate ? `${format(new Date(filterStartDate), 'dd MMM yyyy')} - ${format(new Date(filterEndDate), 'dd MMM yyyy')}` :
                                    filterStartDate ? `From ${format(new Date(filterStartDate), 'dd MMM yyyy')}` :
                                        filterEndDate ? `Until ${format(new Date(filterEndDate), 'dd MMM yyyy')}` :
                                            "All Dates"}
                            </span>
                        </button>

                        {showDatePicker && (
                            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 w-72">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Start Date</label>
                                        <input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">End Date</label>
                                        <input
                                            type="date"
                                            value={filterEndDate}
                                            min={filterStartDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="pt-3 mt-1 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setShowDatePicker(false); }}
                                            className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={() => setShowDatePicker(false)}
                                            className="text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                                        >
                                            Apply Range
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Input Box - Below filters, above nominal/date headers */}
            <div className="px-6 pb-4 pt-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Table Header for Sorting */}
            {filteredExpenses.length > 0 && (
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                    >
                        INFO / TANGGAL
                        {sortOrder === 'newest' && <ChevronDown className="w-3.5 h-3.5" />}
                        {sortOrder === 'oldest' && <ChevronUp className="w-3.5 h-3.5" />}
                        {(sortOrder !== 'newest' && sortOrder !== 'oldest') && <span className="w-3.5 h-3.5 opacity-0"></span>}
                    </button>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'highest' ? 'lowest' : 'highest')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                    >
                        NOMINAL
                        {sortOrder === 'highest' && <ChevronDown className="w-3.5 h-3.5" />}
                        {sortOrder === 'lowest' && <ChevronUp className="w-3.5 h-3.5" />}
                        {(sortOrder !== 'highest' && sortOrder !== 'lowest') && <span className="w-3.5 h-3.5 opacity-0"></span>}
                    </button>
                </div>
            )}

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
                            <div key={expense.id} className="px-3 sm:px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group gap-2">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={cn(
                                        "p-2 rounded-lg shrink-0",
                                        isIncome ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                            isLiving ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                                isPlaying ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                                    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    )}>
                                        {isIncome && <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        {isLiving && <Home className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        {isPlaying && <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        {isSaving && <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">{expense.description}</h4>
                                        <div className="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
                                                    CC
                                                </span>
                                            )}
                                            {expense.profiles && (
                                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-300 hidden sm:inline">
                                                    {expense.profiles.full_name || expense.profiles.username || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={cn(
                                        "font-semibold text-sm sm:text-base",
                                        (isIncome || (isSaving && expense.amount < 0)) ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                                    )}>
                                        {(isIncome || (isSaving && expense.amount < 0)) ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Math.abs(expense.amount))}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            disabled={deletingId === expense.id}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

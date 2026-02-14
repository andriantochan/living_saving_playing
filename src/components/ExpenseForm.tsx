'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X } from 'lucide-react'
import { cn } from '../lib/utils'

type ExpenseFormData = {
    amount: number
    category: 'Living' | 'Playing' | 'Saving' | 'Income'
    description: string
    date: string
    source?: 'Balance' | 'Saving'
}

export function ExpenseForm({ onSubmit, initialData, onCancel, totalSavings = 0 }: { onSubmit: (data: ExpenseFormData) => void, initialData?: ExpenseFormData, onCancel?: () => void, totalSavings?: number }) {
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState<'Living' | 'Playing' | 'Saving' | 'Income'>('Living')
    const [isWithdrawal, setIsWithdrawal] = useState(false)
    const [source, setSource] = useState<'Balance' | 'Saving'>('Balance')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (initialData) {
            const rawAmount = initialData.amount
            setAmount(Math.abs(rawAmount).toString())
            setCategory(initialData.category)
            if (initialData.category === 'Saving' && rawAmount < 0) {
                setIsWithdrawal(true)
            } else {
                setIsWithdrawal(false)
            }
            setDescription(initialData.description)
            // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
            const d = new Date(initialData.date)
            // Adjust to local ISO string roughly
            const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
            setDate(localIso)
        } else {
            // Default source is Balance
            setSource('Balance')
        }
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validate amount
        let cleanAmount = parseInt(amount.replace(/\./g, ''), 10)
        if (isNaN(cleanAmount) || cleanAmount <= 0) {
            setError('Please enter a valid amount')
            setLoading(false)
            return
        }

        // Validate Savings Balance
        if ((category === 'Living' || category === 'Playing') && source === 'Saving') {
            if (cleanAmount > totalSavings) {
                setError(`Insufficient savings! You only have Rp ${totalSavings.toLocaleString('id-ID')}`)
                setLoading(false)
                return
            }
        }

        if (category === 'Saving' && isWithdrawal) {
            cleanAmount = -cleanAmount
        }

        if (!description.trim()) {
            setError('Description is required')
            setLoading(false)
            return
        }

        // Simulate network delay for UX
        await new Promise(resolve => setTimeout(resolve, 500))

        const finalDate = date ? new Date(date).toISOString() : new Date().toISOString()

        onSubmit({
            amount: cleanAmount,
            category,
            description,
            date: finalDate,
            source: (category === 'Living' || category === 'Playing') ? source : undefined
        })

        // Reset form if not editing
        if (!initialData) {
            setAmount('')
            setDescription('')
            setDate('')
            setCategory('Living')
            setIsWithdrawal(false)
            setSource('Balance')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Category</label>
                <div className="grid grid-cols-4 gap-2">
                    {['Living', 'Playing', 'Saving', 'Income'].map((cat) => (
                        <button
                            type="button"
                            key={cat}
                            onClick={() => {
                                setCategory(cat as any)
                                if (cat !== 'Saving') setIsWithdrawal(false)
                            }}
                            className={cn(
                                "py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors border truncate",
                                category === cat
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* ID: Savings Withdrawal Toggle */}
                {category === 'Saving' && (
                    <div className="mt-3 flex items-center space-x-4 bg-gray-50 p-2 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Action:</span>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setIsWithdrawal(false)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                                    !isWithdrawal
                                        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-300"
                                        : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
                                )}
                            >
                                Deposit (Save)
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsWithdrawal(true)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                                    isWithdrawal
                                        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-500 dark:bg-amber-900/40 dark:text-amber-300"
                                        : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
                                )}
                            >
                                Withdraw (Use)
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    {category === 'Living' && "Necessities: Food, rent, utilities, transport."}
                    {category === 'Playing' && "Wants: Hobby, games, vacation, dining out."}
                    {category === 'Saving' && isWithdrawal ? "Taking money from savings." : category === 'Saving' && "Future: Investments, emergency fund, savings."}
                    {category === 'Income' && "Earnings: Salary, freelance, gifts."}
                </p>

                {/* ID: Source Selection for Living/Playing */}
                {(category === 'Living' || category === 'Playing') && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Payment Source</label>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setSource('Balance')}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all border",
                                    source === 'Balance'
                                        ? "bg-white text-indigo-600 border-indigo-500 shadow-sm ring-1 ring-indigo-500 dark:bg-gray-700 dark:text-indigo-400"
                                        : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:hover:bg-gray-700"
                                )}
                            >
                                <span className="flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                                    Wallet Balance
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSource('Saving')}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all border",
                                    source === 'Saving'
                                        ? "bg-white text-emerald-600 border-emerald-500 shadow-sm ring-1 ring-emerald-500 dark:bg-gray-700 dark:text-emerald-400"
                                        : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:hover:bg-gray-700"
                                )}
                            >
                                <span className="flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                                    Savings ({totalSavings > 0 ? `Rp ${(totalSavings / 1000).toFixed(0)}k` : '0'})
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Amount (IDR)</label>
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                            setAmount(formatted)
                        }}
                        placeholder="e.g. 50.000"
                        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Steam Wallet, Nasi Goreng"
                        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Date (Optional)</label>
                <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Leave empty to use current time.</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full flex items-center justify-center text-white font-medium py-2.5 rounded-lg transition-all focus:ring-4 disabled:opacity-70",
                    initialData
                        ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                )}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : initialData ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {initialData ? 'Update Transaction' : 'Add Transaction'}
            </button>
        </form>
    )
}

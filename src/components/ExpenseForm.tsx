'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X } from 'lucide-react'
import { cn } from '../lib/utils'

type ExpenseFormData = {
    amount: number
    category: 'Living' | 'Playing' | 'Saving' | 'Income'
    sub_category?: string
    description: string
    date: string
    source?: 'Balance' | 'Saving' | 'Credit Card'
}

type SavingGoal = {
    id: string
    project_id: string
    name: string
    sub_category: string
    target_amount: number
    current_amount: number
}

const DEFAULT_SUB_CATEGORIES: Record<string, string[]> = {
    Living: ['Makan', 'Groceries', 'Laundry', 'Wifi', 'Listrik', 'Uang Kos', 'Transport', 'Lainnya'],
    Playing: ['Fashion', 'Skincare/Makeup', 'Jalan-jalan', 'Jajan', 'Gym', 'Hobi', 'Langganan', 'Lainnya'],
    Saving: ['Darurat', 'Investasi', 'Tabungan', 'Lainnya'],
    Income: ['Gaji', 'Bonus', 'Hadiah', 'Lainnya']
}

// Format raw digit string to Indonesian thousands-separator display
function formatDisplay(raw: string): string {
    if (!raw) return ''
    const num = parseInt(raw, 10)
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('id-ID').format(num)
}



export function ExpenseForm({ onSubmit, initialData, onCancel, totalSavings = 0, savingGoals = [] }: {
    onSubmit: (data: ExpenseFormData) => void
    initialData?: ExpenseFormData
    onCancel?: () => void
    totalSavings?: number
    savingGoals?: SavingGoal[]
}) {
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState<'Living' | 'Playing' | 'Saving' | 'Income'>('Living')
    const [subCategory, setSubCategory] = useState<string>('Makan')
    const [isWithdrawal, setIsWithdrawal] = useState(false)
    const [source, setSource] = useState<'Balance' | 'Saving' | 'Credit Card'>('Balance')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const subCategories: Record<string, string[]> = { ...DEFAULT_SUB_CATEGORIES }

    useEffect(() => {
        if (!initialData) {
            setSubCategory(DEFAULT_SUB_CATEGORIES[category][0])
        }
    }, [category, initialData])

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
            if (initialData.sub_category) {
                setSubCategory(initialData.sub_category)
            } else {
                setSubCategory(subCategories[initialData.category][0])
            }
            setDescription(initialData.description)
            const d = new Date(initialData.date)
            const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            setDate(localDate)
            if (initialData.source) {
                setSource(initialData.source)
            }
        } else {
            setSource('Balance')
        }
    }, [initialData])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        let cleanAmount = parseInt(amount, 10)
        if (isNaN(cleanAmount) || cleanAmount <= 0) {
            setError('Please enter a valid amount')
            setLoading(false)
            return
        }

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

        await new Promise(resolve => setTimeout(resolve, 500))

        const finalDate = date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString()

        onSubmit({
            amount: cleanAmount,
            category,
            sub_category: subCategory,
            description,
            date: finalDate,
            source: (category === 'Living' || category === 'Playing') ? source : undefined
        })

        if (!initialData) {
            setAmount('')
            setDescription('')
            setDate('')
            setCategory('Living')
            setSubCategory(subCategories['Living'][0])
            setIsWithdrawal(false)
            setSource('Balance')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Category</label>
                <div className="grid grid-cols-4 gap-2">
                    {(['Living', 'Playing', 'Saving', 'Income'] as const).map((cat) => (
                        <button
                            type="button"
                            key={cat}
                            onClick={() => {
                                setCategory(cat)
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

                {/* Savings Withdrawal Toggle */}
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

                {/* Sub Category */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Sub Category</label>
                    <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    >
                        {subCategories[category].map((subCat) => (
                            <option key={subCat} value={subCat}>{subCat}</option>
                        ))}
                    </select>
                </div>

                {/* Payment Source */}
                {(category === 'Living' || category === 'Playing') && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Payment Source</label>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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
                            <button
                                type="button"
                                onClick={() => setSource('Credit Card')}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all border",
                                    source === 'Credit Card'
                                        ? "bg-white text-orange-600 border-orange-500 shadow-sm ring-1 ring-orange-500 dark:bg-gray-700 dark:text-orange-400"
                                        : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:hover:bg-gray-700"
                                )}
                            >
                                <span className="flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                                    Credit Card
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

                {/* Amount input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Amount (IDR)</label>

                <div className={cn(
                    "w-full h-14 px-4 rounded-md border-2 flex items-center justify-between transition-colors",
                    amount
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600"
                )}>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">Rp</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={amount ? formatDisplay(amount) : ''}
                        onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '')
                            if (digits === '') {
                                setAmount('')
                            } else if (digits.length <= 12) {
                                setAmount(String(parseInt(digits, 10)))
                            }
                        }}
                        placeholder="0"
                        className="flex-1 text-2xl font-bold tracking-wide text-right bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 mx-2"
                    />
                    {amount && (
                        <button
                            type="button"
                            onClick={() => setAmount('')}
                            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Description + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Date (Optional)</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Leave empty to use today's date.</p>
                </div>
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

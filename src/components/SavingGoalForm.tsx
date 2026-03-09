'use client'

import { useState } from 'react'

type SavingGoalFormData = {
    name: string
    sub_category: string
    target_amount: number
}

type SavingGoalFormProps = {
    onSubmit: (data: SavingGoalFormData) => void
    onCancel: () => void
    initialData?: SavingGoalFormData
}

const SAVING_CATEGORIES = ['Darurat', 'Investasi', 'Tabungan', 'Lainnya']

export function SavingGoalForm({ onSubmit, onCancel, initialData }: SavingGoalFormProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [subCategory, setSubCategory] = useState(initialData?.sub_category || SAVING_CATEGORIES[0])
    const [targetAmount, setTargetAmount] = useState(initialData?.target_amount?.toString() || '')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            name,
            sub_category: subCategory,
            target_amount: Number(targetAmount)
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 lg:mb-1">Goal Name</label>
                <input
                    type="text"
                    required
                    maxLength={30}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 placeholder-gray-400"
                    placeholder="e.g. Dana Darurat"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 lg:mb-1">Linked Category</label>
                <select
                    required
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                    {SAVING_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Transactions under this category will add to the goal's progress.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 lg:mb-1">Target Amount (Rp)</label>
                    <input
                        type="number"
                        required
                        min="0"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 placeholder-gray-400"
                        placeholder="10000000"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    {initialData ? 'Update Goal' : 'Add Goal'}
                </button>
            </div>
        </form>
    )
}

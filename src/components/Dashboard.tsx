'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react'
import { Modal } from './Modal'
import { ExpenseForm } from './ExpenseForm'

type Expense = {
    id: string
    amount: number
    category: 'Living' | 'Playing' | 'Saving' | 'Income'
    description: string
    date: string
}

export function Dashboard({ expenses, onAddExpense, totalIncome, totalExpenses, balance }: { expenses: Expense[], onAddExpense: (expense: Omit<Expense, 'id'>) => void, totalIncome: number, totalExpenses: number, balance: number }) {
    const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<'All' | 'Living' | 'Playing' | 'Saving'>('All')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Calculate totals per category for Pie Chart
    const categoryTotals = useMemo(() => {
        const totals = {
            Living: 0,
            Playing: 0,
            Saving: 0
        }
        expenses.forEach(exp => {
            if (exp.category !== 'Income') {
                totals[exp.category] += exp.amount
            }
        })
        return [
            { name: 'Living', value: totals.Living, color: '#3b82f6' }, // Blue-500
            { name: 'Playing', value: totals.Playing, color: '#ef4444' }, // Red-500
            { name: 'Saving', value: totals.Saving, color: '#10b981' }, // Emerald-500
        ].filter(item => item.value > 0)
    }, [expenses])

    // Prepare data for Monthly Spending History Bar Chart
    const monthlyHistory = useMemo(() => {
        const history: Record<string, { name: string, Living: number, Playing: number, Saving: number, total: number }> = {}

        // Sort expenses by date ascending to build history correctly
        const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        sortedExpenses.forEach(exp => {
            if (exp.category === 'Income') return

            const date = new Date(exp.date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
            const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

            if (!history[monthKey]) {
                history[monthKey] = { name: monthName, Living: 0, Playing: 0, Saving: 0, total: 0 }
            }

            history[monthKey][exp.category] += exp.amount
            history[monthKey].total += exp.amount
        })

        // Fill in missing months if needed, or just return existing
        // For now, let's just return the last 6 months present in data or empty
        const keys = Object.keys(history).sort()
        const recentKeys = keys.slice(-6) // Last 6 months

        return recentKeys.map(key => history[key])
    }, [expenses])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Budget Status Logic (Simple Example)
    const budgetLimit = 5000000 // Example fixed budget
    const isOverBudget = totalExpenses > budgetLimit
    const budgetHealthColor = isOverBudget ? 'text-red-500' : 'text-emerald-500'
    const budgetHealthBg = isOverBudget ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'

    // Calculate previous month comparison (mockup logic for "vs last month")
    // In a real app, you'd calculate this from `expenses`
    const incomeGrowth = 100 // Mock 100% growth for now or calculate real
    const expenseGrowth = 0 // Mock

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Wallet Balance */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Total Balance</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold tracking-tight">{formatCurrency(balance)}</h3>
                        <p className="text-indigo-100 text-sm font-medium opacity-90">Net worth (All time)</p>
                    </div>
                </div>

                {/* Income Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Income ({new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit' })})</p>
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md dark:bg-emerald-900/30 dark:text-emerald-400">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalIncome)}</h3>
                        <div className="flex items-center text-xs">
                            <span className="text-emerald-600 font-medium flex items-center dark:text-emerald-400">
                                <TrendingUp className="w-3 h-3 mr-1" /> +{incomeGrowth}%
                            </span>
                            <span className="text-gray-400 ml-2 dark:text-gray-500">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Expenses Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expenses ({new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit' })})</p>
                        <div className="p-1.5 bg-red-100 text-red-600 rounded-md dark:bg-red-900/30 dark:text-red-400">
                            <ArrowDownRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalExpenses)}</h3>
                        <div className="flex items-center text-xs justify-between">
                            <span className="text-gray-400 dark:text-gray-500 flex items-center">
                                Target: <span className="text-gray-600 dark:text-gray-300 ml-1 font-medium">{formatCurrency(budgetLimit)}</span>
                                <PencilIcon className="w-3 h-3 ml-1 cursor-pointer hover:text-indigo-500" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cash Flow / Saving Rate */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cash Flow ({new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit' })})</p>
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md dark:bg-blue-900/30 dark:text-blue-400">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {totalIncome - totalExpenses >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpenses)}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Income - Expense</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Monthly Spending History</h3>
                        <div className="flex space-x-2">
                            <select
                                className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                value={selectedHistoryCategory}
                                onChange={(e) => setSelectedHistoryCategory(e.target.value as any)}
                            >
                                <option value="All">All Categories</option>
                                <option value="Living">Living</option>
                                <option value="Playing">Playing</option>
                                <option value="Saving">Saving</option>
                            </select>
                        </div>
                    </div>

                    <div className="h-[350px] w-full bg-gray-50/50 rounded-lg p-2 dark:bg-gray-900/30">
                        {monthlyHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid-stroke)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--chart-axis-tick)', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--chart-axis-tick)', fontSize: 12 }}
                                        tickFormatter={(value) => `Rp${value / 1000}k`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                        formatter={(value: any, name: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, name]}
                                        labelFormatter={(label) => new Date(label + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                        cursor={{ fill: '#374151', opacity: 0.4 }}
                                    />
                                    <Legend />
                                    {selectedHistoryCategory === 'All' ? (
                                        <>
                                            <Bar dataKey="Saving" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
                                            <Bar dataKey="Playing" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={32} />
                                            <Bar dataKey="Living" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                                        </>
                                    ) : (
                                        <Bar
                                            dataKey={selectedHistoryCategory}
                                            fill={selectedHistoryCategory === 'Living' ? '#3b82f6' : selectedHistoryCategory === 'Playing' ? '#ef4444' : '#10b981'}
                                            radius={[4, 4, 4, 4]}
                                            barSize={32}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                                No history data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Panel: Budget & Pie Chart */}
                <div className="space-y-6">
                    {/* Budget Status Widget */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-gray-500 text-sm font-medium mb-4 dark:text-gray-400">Budget Status</h3>

                        <div className={`p-4 rounded-lg flex items-start gap-3 ${budgetHealthBg}`}>
                            <div className={`p-1.5 rounded-full bg-white/50 ${budgetHealthColor}`}>
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={`font-semibold ${budgetHealthColor}`}>
                                    {isOverBudget ? 'Over Budget' : 'Healthy'}
                                </h4>
                                <p className={`text-xs mt-1 ${isOverBudget ? 'text-red-600/80 dark:text-red-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                                    {isOverBudget
                                        ? `You exceeded budget by ${formatCurrency(totalExpenses - budgetLimit)}`
                                        : 'Within budget range.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Pie Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex flex-col h-[350px]">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">Breakdown</h3>
                        <div className="flex-1 min-h-0 relative">
                            {categoryTotals.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryTotals}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryTotals.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                            itemStyle={{ color: '#f3f4f6' }}
                                            formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                    No data
                                </div>
                            )}


                            {/* Custom Center Label if needed or Bottom Legend */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Button - Floating Action Button for Mobile or Header Button */}
            <div className="fixed bottom-6 right-6 md:hidden z-10">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all focus:ring-4 focus:ring-indigo-300"
                >
                    <ArrowUpRight className="w-6 h-6" />
                </button>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Transaction">
                <ExpenseForm
                    onSubmit={(data) => {
                        onAddExpense(data)
                        setIsAddModalOpen(false)
                    }}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    )
}

function PencilIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
    )
}

function formatCurrencyCompact(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1
    }).format(amount)
}

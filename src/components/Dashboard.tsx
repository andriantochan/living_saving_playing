'use client'

import { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp, AlertTriangle, Wallet, PiggyBank, Gamepad2, Home, Calendar, Edit2, Check, X, Banknote, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'

type Expense = {
    id: string
    amount: number
    category: 'Living' | 'Playing' | 'Saving' | 'Income'
    description: string
    date: string
}

const COLORS = {
    Living: '#3b82f6', // blue-500
    Playing: '#ef4444', // red-500
    Saving: '#10b981', // emerald-500
    Income: '#f59e0b', // amber-500
}

export function Dashboard({ expenses, selectedMonth }: { expenses: Expense[], selectedMonth: string }) {
    // Filter expenses for the selected month (YYYY-MM format)
    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => exp.date.startsWith(selectedMonth))
    }, [expenses, selectedMonth])

    // Calculate totals for selected month
    // Calculate totals for selected month
    const monthlyIncome = filteredExpenses.filter(e => e.category === 'Income').reduce((sum, item) => sum + item.amount, 0)
    const monthlyExpense = filteredExpenses.filter(e => e.category !== 'Income').reduce((sum, item) => sum + item.amount, 0)
    const monthlyBalance = monthlyIncome - monthlyExpense

    // Calculate All-Time Wallet Balance
    const allTimeBalance = useMemo(() => {
        return expenses.reduce((acc, curr) => {
            if (curr.category === 'Income') return acc + curr.amount
            return acc - curr.amount
        }, 0)
    }, [expenses])

    const categoryTotals = useMemo(() => {
        const totals = { Living: 0, Playing: 0, Saving: 0 }
        filteredExpenses.forEach(exp => {
            if (exp.category === 'Income') return // Skip Income for expense breakdown
            if (totals[exp.category as keyof typeof totals] !== undefined) {
                totals[exp.category as keyof typeof totals] += exp.amount
            }
        })
        return [
            { name: 'Living', value: totals.Living },
            { name: 'Playing', value: totals.Playing },
            { name: 'Saving', value: totals.Saving },
        ]
    }, [filteredExpenses])

    // Calculate Average Monthly Spending (excluding Income)
    const averageMonthlyValues = useMemo(() => {
        const monthlyTotals: Record<string, number> = {}
        const monthsCounted = new Set<string>()

        expenses.forEach(exp => {
            if (exp.category === 'Income') return
            const month = exp.date.substring(0, 7)

            // Skip current month for "historical" average, or include it? 
            // Usually average is based on past data. Let's exclude current selected month if it's incomplete, 
            // but for simplicity, let's include all OTHER months.
            if (month === selectedMonth) return

            if (!monthlyTotals[month]) monthlyTotals[month] = 0
            monthlyTotals[month] += exp.amount
            monthsCounted.add(month)
        })

        const totalHistoricalExpense = Object.values(monthlyTotals).reduce((a, b) => a + b, 0)
        const count = monthsCounted.size

        return count > 0 ? Math.round(totalHistoricalExpense / count) : 5000000 // Default 5jt if no history
    }, [expenses, selectedMonth])

    const [budget, setBudget] = useState(averageMonthlyValues)
    const [isEditingBudget, setIsEditingBudget] = useState(false)
    const [budgetInput, setBudgetInput] = useState('')

    // Fetch budget for selected month
    useEffect(() => {
        const fetchBudget = async () => {
            const { data, error } = await supabase
                .from('budgets')
                .select('amount')
                .eq('month', selectedMonth)
                .single()

            if (data) {
                setBudget(data.amount)
            } else {
                // If no manual budget, use the calculated average
                setBudget(averageMonthlyValues)
            }
        }
        fetchBudget()
    }, [selectedMonth, averageMonthlyValues])

    const handleSaveBudget = async () => {
        const amount = parseInt(budgetInput.replace(/\./g, ''))
        if (isNaN(amount) || amount <= 0) return

        const { error } = await supabase
            .from('budgets')
            .upsert({ month: selectedMonth, amount }, { onConflict: 'month' })

        if (!error) {
            setBudget(amount)
            setIsEditingBudget(false)
        } else {
            alert('Failed to save budget')
        }
    }

    const startEditingBudget = () => {
        setBudgetInput(budget.toLocaleString('id-ID'))
        setIsEditingBudget(true)
    }

    const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<'All' | 'Living' | 'Playing' | 'Saving'>('All')

    // Prepare data for Monthly Total Bar Chart (Last 6 months + Current? Or all?)
    // Prepare data for Monthly Total Bar Chart (Last 6 months + Current? Or all?)
    const monthlyData = useMemo(() => {
        const totalsByMonth: Record<string, { total: number, Living: number, Playing: number, Saving: number }> = {}

        expenses.forEach(exp => {
            if (selectedHistoryCategory !== 'All' && exp.category !== selectedHistoryCategory) return

            // Skip income for generic "Total" history unless specifically selected (future improvement)
            // For now, let's keep the existing graph as "Expense History"
            if (exp.category === 'Income') return

            const month = exp.date.substring(0, 7) // YYYY-MM

            if (!totalsByMonth[month]) {
                totalsByMonth[month] = { total: 0, Living: 0, Playing: 0, Saving: 0 }
            }

            totalsByMonth[month].total += exp.amount
            if (exp.category === 'Living') totalsByMonth[month].Living += exp.amount
            if (exp.category === 'Playing') totalsByMonth[month].Playing += exp.amount
            if (exp.category === 'Saving') totalsByMonth[month].Saving += exp.amount
        })

        // Sort keys and take last 6
        return Object.keys(totalsByMonth).sort().map(month => ({
            month,
            ...totalsByMonth[month]
        }))
    }, [expenses, selectedHistoryCategory])

    // Dynamic monthly limit
    const isOverBudget = monthlyExpense > budget
    const isNearBudget = monthlyExpense > budget * 0.8 && !isOverBudget

    return (
        <div className="flex flex-col gap-6 mb-8">
            {/* Top Row: Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Wallet Balance */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-xl shadow-lg text-white">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-indigo-100 text-xs font-medium">Wallet Balance</p>
                        <div className="p-1.5 bg-white/20 rounded-lg">
                            <CreditCard className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold">Rp {allTimeBalance.toLocaleString('id-ID')}</h3>
                    <p className="text-[10px] text-indigo-100 opacity-80 mt-1">Net worth (All time)</p>
                </div>

                {/* Income */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 text-xs font-medium">Income ({selectedMonth})</p>
                        <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                            <ArrowDownRight className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Rp {monthlyIncome.toLocaleString('id-ID')}</h3>
                    <p className="text-[10px] text-green-600 font-medium mt-1">+100% vs last month</p>
                </div>

                {/* Expenses & Budget Target */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 text-xs font-medium">Expenses ({selectedMonth})</p>
                        <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Rp {monthlyExpense.toLocaleString('id-ID')}</h3>

                    <div className="mt-1 text-[10px] text-gray-500 flex items-center gap-1">
                        <span>Target:</span>
                        {isEditingBudget ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={budgetInput}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '')
                                        const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                        setBudgetInput(formatted)
                                    }}
                                    className="w-16 px-1 py-0.5 border border-indigo-300 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[10px]"
                                    autoFocus
                                />
                                <button onClick={handleSaveBudget} className="text-green-600 hover:text-green-700"><Check className="w-3 h-3" /></button>
                                <button onClick={() => setIsEditingBudget(false)} className="text-red-500 hover:text-red-600"><X className="w-3 h-3" /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 transition-colors" onClick={startEditingBudget}>
                                <span className={cn(isOverBudget ? "text-red-600 font-medium" : "text-gray-700")}>
                                    Rp {budget.toLocaleString('id-ID')}
                                </span>
                                <Edit2 className="w-2.5 h-2.5 text-gray-400 opacity-50" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Cash Flow */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 text-xs font-medium">Cash Flow ({selectedMonth})</p>
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className={cn("text-2xl font-bold", monthlyBalance >= 0 ? "text-gray-900" : "text-red-600")}>
                        {monthlyBalance > 0 ? '+' : ''} Rp {monthlyBalance.toLocaleString('id-ID')}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">Income - Expense</p>
                </div>
            </div>

            {/* Bottom Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: History Bar Chart (Span 2) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Monthly Spending History</h3>
                        <select
                            value={selectedHistoryCategory}
                            onChange={(e) => setSelectedHistoryCategory(e.target.value as any)}
                            className="text-sm border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="All">All Categories</option>
                            <option value="Living">Living</option>
                            <option value="Playing">Playing</option>
                            <option value="Saving">Saving</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(str) => {
                                        const date = new Date(str + '-01')
                                        return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
                                    }}
                                />
                                <YAxis hide />
                                <RechartsTooltip
                                    formatter={(value: any, name: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, name]}
                                    labelFormatter={(label) => new Date(label + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                    cursor={{ fill: '#f3f4f6' }}
                                />
                                {selectedHistoryCategory === 'All' ? (
                                    <>
                                        <Bar dataKey="Living" stackId="a" fill={COLORS.Living} radius={[0, 0, 0, 0]} barSize={50} />
                                        <Bar dataKey="Playing" stackId="a" fill={COLORS.Playing} radius={[0, 0, 0, 0]} barSize={50} />
                                        <Bar dataKey="Saving" stackId="a" fill={COLORS.Saving} radius={[4, 4, 0, 0]} barSize={50} />
                                    </>
                                ) : (
                                    <Bar
                                        dataKey="total"
                                        fill={COLORS[selectedHistoryCategory]}
                                        radius={[4, 4, 0, 0]}
                                        barSize={50}
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Breakdown & Status (Span 1) */}
                <div className="flex flex-col gap-6">
                    {/* Budget Status */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Budget Status</h4>
                        {isOverBudget ? (
                            <div className="flex items-start p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
                                <div>
                                    <span className="font-semibold block">Over Limit!</span>
                                    <span className="text-xs opacity-90">Please reduce spending.</span>
                                </div>
                            </div>
                        ) : isNearBudget ? (
                            <div className="flex items-start p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                                <TrendingUp className="w-5 h-5 mr-3 shrink-0" />
                                <div>
                                    <span className="font-semibold block">Caution</span>
                                    <span className="text-xs opacity-90">Approaching limit.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                                <Wallet className="w-5 h-5 mr-3 shrink-0" />
                                <div>
                                    <span className="font-semibold block">Healthy</span>
                                    <span className="text-xs opacity-90">Within budget range.</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Breakdown Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Breakdown</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryTotals}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryTotals.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                                    />
                                    {/* Legend moved to bottom to save side space */}
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                            {categoryTotals.map((cat) => {
                                const percentage = monthlyExpense > 0 ? (cat.value / monthlyExpense) * 100 : 0
                                return (
                                    <div key={cat.name} className="text-center">
                                        <div className={cn("w-2 h-2 rounded-full mx-auto mb-1",
                                            cat.name === 'Living' ? 'bg-blue-500' :
                                                cat.name === 'Playing' ? 'bg-red-500' : 'bg-emerald-500'
                                        )}></div>
                                        <span className="text-gray-500 block truncate">{cat.name}</span>
                                        <span className="font-semibold text-gray-900 block">{(cat.value / 1000).toFixed(0)}k</span>
                                        <span className="text-[10px] text-gray-400 block">{percentage.toFixed(0)}%</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

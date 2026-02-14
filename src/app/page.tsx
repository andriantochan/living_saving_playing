'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Dashboard } from '../components/Dashboard'
import { ExpenseForm } from '../components/ExpenseForm'
import { ExpenseList } from '../components/ExpenseList'
import { ThemeToggle } from '../components/ThemeToggle'
import { Modal } from '../components/Modal'
import { PlusCircle, Wallet, Filter, Download } from 'lucide-react'
import { toast } from 'sonner'

// Define the type here or import from a shared types file
type Expense = {
  id: string
  amount: number
  category: 'Living' | 'Playing' | 'Saving' | 'Income'
  description: string
  date: string
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)) // YYYY-MM

  // const supabase = createClient(...) - Removed, using imported instance

  const fetchExpenses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    } else {
      setExpenses(data as Expense[] || [])
      // If we don't have a selected month yet (or invalid), default to current
      if (!selectedMonth) {
        setSelectedMonth(new Date().toISOString().substring(0, 7))
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  // Derived state for available months
  const availableMonths = useMemo(() => {
    const months = new Set(expenses.map(e => e.date.substring(0, 7)))
    // Always include current month
    months.add(new Date().toISOString().substring(0, 7))
    return Array.from(months).sort().reverse()
  }, [expenses])

  // Filter expenses for the list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedMonth))
  }, [expenses, selectedMonth])

  // derived state for totals
  const { totalIncome, totalExpenses, balance, totalSavings } = useMemo(() => {
    let income = 0
    let expense = 0
    let allTimeIncome = 0
    let allTimeExpense = 0
    let allTimeSavings = 0

    expenses.forEach(e => {
      const amount = Number(e.amount) || 0
      const isIncome = e.category === 'Income'
      const isSaving = e.category === 'Saving'

      if (isIncome) allTimeIncome += amount
      else allTimeExpense += amount

      if (isSaving) allTimeSavings += amount

      if (e.date.startsWith(selectedMonth)) {
        if (isIncome) income += amount
        else expense += amount
      }
    })

    return {
      totalIncome: income,
      totalExpenses: expense,
      balance: allTimeIncome - allTimeExpense,
      totalSavings: allTimeSavings
    }
  }, [expenses, selectedMonth])

  const handleAddExpense = async (data: Omit<Expense, 'id'> & { source?: 'Balance' | 'Saving' }) => {
    const expensesToInsert = [
      {
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date
      }
    ]

    // If paid from savings, add a withdrawal transaction
    if (data.source === 'Saving') {
      expensesToInsert.push({
        amount: -data.amount,
        category: 'Saving',
        description: `Cover for: ${data.description}`,
        date: data.date
      })
    }

    const { error } = await supabase.from('expenses').insert(expensesToInsert)

    if (error) {
      console.error('Error adding expense:', error)
      toast.error('Failed to add expense')
    } else {
      toast.success('Transaction added successfully')
      fetchExpenses()
      setShowForm(false)
      setEditingExpense(null)
    }
  }

  const handleUpdateExpense = async (data: Omit<Expense, 'id'>) => {
    if (!editingExpense) return
    const { error } = await supabase
      .from('expenses')
      .update(data)
      .eq('id', editingExpense.id)

    if (error) {
      console.error('Error updating expense:', error)
      toast.error('Failed to update expense')
    } else {
      toast.success('Transaction updated successfully')
      fetchExpenses()
      setShowForm(false)
      setEditingExpense(null)
    }
  }

  const handleExport = () => {
    if (filteredExpenses.length === 0) return toast.error('No expenses to export')

    const headers = ['Date', 'Category', 'Description', 'Amount', 'Type']
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(exp => {
        const type = exp.category === 'Saving' ? 'Income' : 'Expense'
        const desc = `"${(exp.description || '').replace(/"/g, '""')}"`
        return `${exp.date},${exp.category},${desc},${exp.amount},${type}`
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `expenses-${selectedMonth}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Financial Tracker</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Living • Playing • Saving</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Export CSV Button */}
            <button
              onClick={handleExport}
              className="flex items-center justify-center p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Month Filter Dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 appearance-none h-10 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setShowForm(!showForm)
                setEditingExpense(null)
              }}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm h-10 ml-auto md:ml-0 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">{showForm && !editingExpense ? 'Hide' : 'Add'}</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Dashboard
              expenses={expenses}
              onAddExpense={handleAddExpense}
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              balance={balance}
              totalSavings={totalSavings}
            />

            <Modal
              isOpen={showForm}
              onClose={() => {
                setShowForm(false)
                setEditingExpense(null)
              }}
              title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
            >
              <ExpenseForm
                initialData={editingExpense || undefined}
                onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
                onCancel={() => {
                  setShowForm(false)
                  setEditingExpense(null)
                }}
                totalSavings={totalSavings}
              />
            </Modal>

            <ExpenseList
              expenses={filteredExpenses}
              onDelete={fetchExpenses}
              onEdit={(expense) => {
                setEditingExpense(expense)
                setShowForm(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        )}
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Dashboard } from '../components/Dashboard'
import { ExpenseForm } from '../components/ExpenseForm'
import { ExpenseList } from '../components/ExpenseList'
import { PlusCircle, Wallet, Filter, Download } from 'lucide-react'

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

  const handleExport = () => {
    if (filteredExpenses.length === 0) return alert('No expenses to export')

    const headers = ['Date', 'Category', 'Description', 'Amount', 'Type']
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(exp => {
        const type = exp.category === 'Saving' ? 'Income' : 'Expense'
        // Escape quotes and wrap in quotes to handle commas in description
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
    <main className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Tracker</h1>
              <p className="text-sm text-gray-500">Living • Playing • Saving</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Export CSV Button */}
            <button
              onClick={handleExport}
              className="flex items-center justify-center p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm h-10"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Month Filter Dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 appearance-none h-10 shadow-sm"
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
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm h-10 ml-auto md:ml-0"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">{showForm && !editingExpense ? 'Hide' : 'Add'}</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard receives ALL expenses for historical chart, but uses selectedMonth for pie chart */}
            <Dashboard expenses={expenses} selectedMonth={selectedMonth} />

            {showForm && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <ExpenseForm
                    initialData={editingExpense}
                    onAddExpense={() => {
                      fetchExpenses()
                      setShowForm(false)
                      setEditingExpense(null)
                    }}
                    onCancel={() => {
                      setShowForm(false)
                      setEditingExpense(null)
                    }}
                  />
                </div>
              </div>
            )}

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

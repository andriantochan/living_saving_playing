'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Dashboard } from '../../components/Dashboard'
import { ExpenseForm } from '../../components/ExpenseForm'
import { ExpenseList } from '../../components/ExpenseList'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Modal } from '../../components/Modal'
import { PlusCircle, Wallet, Filter, Download, LogOut, User, UserPlus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Expense = {
    id: string
    amount: number
    category: 'Living' | 'Playing' | 'Saving' | 'Income'
    description: string
    date: string
    project_id?: string
    user_id?: string
    profiles?: {
        full_name: string | null
        username: string | null
    }
}

type Project = {
    id: string
    name: string
    role: 'owner' | 'member'
}

type UserProfile = {
    full_name: string | null
    username: string | null
}

function ProjectContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()

    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)) // YYYY-MM or 'all'
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        const init = async () => {
            // Validate ID
            if (!id || id === 'undefined' || id.length < 30) {
                toast.error('Invalid Project ID')
                router.push('/home')
                return
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            // Fetch User Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, username')
                .eq('id', session.user.id)
                .single()

            setUserProfile(profile)

            // Check if user is a member of this specific project
            const { data: member, error: memberError } = await supabase
                .from('project_members')
                .select('project_id, role, projects(name)')
                .eq('user_id', session.user.id)
                .eq('project_id', id)
                .single()

            if (member && member.projects) {
                // Known issue: Typescript might complain about nested data, but Supabase returns it.
                // Casting for simplicity in this context.
                const projectData = member.projects as unknown as { name: string }

                setCurrentProject({
                    id: member.project_id,
                    name: projectData.name,
                    role: member.role as 'owner' | 'member'
                })
                fetchExpenses(member.project_id)
            } else {
                console.error('Project load error:', memberError)
                // Redirect to home if not found or no access
                toast.error('Project not found or access denied')
                router.push('/home')
            }
        }
        init()
    }, [id, router])

    const fetchExpenses = async (projectId: string) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('expenses')
            .select('*, profiles(full_name, username)')
            .eq('project_id', projectId)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching expenses:', error)
            toast.error('Failed to load expenses')
        } else {
            setExpenses(data as Expense[] || [])
            if (!selectedMonth) {
                setSelectedMonth(new Date().toISOString().substring(0, 7))
            }
        }
        setLoading(false)
    }

    // Derived state for available months
    const availableMonths = useMemo(() => {
        const months = new Set(expenses.map(e => e.date.substring(0, 7)))
        months.add(new Date().toISOString().substring(0, 7))
        return Array.from(months).sort().reverse()
    }, [expenses])

    // Filter expenses for the list
    const filteredExpenses = useMemo(() => {
        if (selectedMonth === 'all') return expenses
        return expenses.filter(e => e.date.startsWith(selectedMonth))
    }, [expenses, selectedMonth])

    // derived state for totals
    const { totalIncome, totalExpenses, balance, totalSavings, allTimeExpenses } = useMemo(() => {
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

            if (selectedMonth === 'all' || e.date.startsWith(selectedMonth)) {
                if (isIncome) income += amount
                else expense += amount
            }
        })

        return {
            totalIncome: income,
            totalExpenses: expense,
            balance: allTimeIncome - allTimeExpense,
            totalSavings: allTimeSavings,
            allTimeExpenses: allTimeExpense
        }
    }, [expenses, selectedMonth])

    const handleAddExpense = async (data: Omit<Expense, 'id' | 'project_id' | 'user_id' | 'profiles'> & { source?: 'Balance' | 'Saving' }) => {
        if (!currentProject) {
            toast.error('No active project found')
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const expensesToInsert = [
            {
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
                project_id: currentProject.id,
                user_id: user.id // Keeping user_id for audit, specifically requested by schema too
            }
        ]

        // If paid from savings, add a withdrawal transaction
        if (data.source === 'Saving') {
            expensesToInsert.push({
                amount: -data.amount,
                category: 'Saving',
                description: `Cover for: ${data.description}`,
                date: data.date,
                project_id: currentProject.id,
                user_id: user.id
            })
        }

        const { error } = await supabase.from('expenses').insert(expensesToInsert)

        if (error) {
            console.error('Error adding expense:', error)
            toast.error('Failed to add expense')
        } else {
            toast.success('Transaction added successfully')
            fetchExpenses(currentProject.id)
            setShowForm(false)
            setEditingExpense(null)
        }
    }

    const handleUpdateExpense = async (data: Omit<Expense, 'id' | 'profiles'>) => {
        if (!editingExpense || !currentProject) return
        const { error } = await supabase
            .from('expenses')
            .update({
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
            })
            .eq('id', editingExpense.id)
            .eq('project_id', currentProject.id) // Security check

        if (error) {
            console.error('Error updating expense:', error)
            toast.error('Failed to update expense')
        } else {
            toast.success('Transaction updated successfully')
            fetchExpenses(currentProject.id)
            setShowForm(false)
            setEditingExpense(null)
        }
    }

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentProject || !inviteEmail) return

        // Check role again
        if (currentProject.role !== 'owner') {
            toast.error('Only owners can invite members')
            return
        }

        try {
            // 1. Find user by email
            const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', inviteEmail)
                .single()

            if (userError || !userProfile) {
                toast.error('User not found. Please check the email.')
                return
            }

            // 2. Add to project_members
            const { error: memberError } = await supabase
                .from('project_members')
                .insert({
                    project_id: currentProject.id,
                    user_id: userProfile.id,
                    role: 'member'
                })

            if (memberError) {
                if (memberError.code === '23505') { // Unique violation
                    toast.error('User is already a member of this project')
                } else {
                    toast.error('Failed to add member')
                    console.error(memberError)
                }
            } else {
                toast.success('Member added successfully')
                setShowInviteModal(false)
                setInviteEmail('')
            }

        } catch (err) {
            toast.error('An unexpected error occurred')
            console.error(err)
        }
    }

    const handleExport = () => {
        if (filteredExpenses.length === 0) return toast.error('No expenses to export')

        const headers = ['Date', 'Category', 'Description', 'Amount', 'Type', 'Added By']
        const csvContent = [
            headers.join(','),
            ...filteredExpenses.map(exp => {
                const type = exp.category === 'Saving' ? 'Income' : 'Expense'
                const desc = `"${(exp.description || '').replace(/"/g, '""')}"`
                const addedBy = exp.profiles ? (exp.profiles.full_name || exp.profiles.username || 'Unknown') : 'Unknown'
                return `${exp.date},${exp.category},${desc},${exp.amount},${type},${addedBy}`
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

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            toast.error('Error logging out')
        } else {
            router.push('/login')
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center space-x-3">
                        <Link href="/home" className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Financial Tracker</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span>{currentProject ? currentProject.name : 'Loading project...'}</span>
                                {userProfile && (
                                    <>
                                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                            <User className="w-3 h-3" />
                                            {userProfile.full_name || userProfile.username}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors shadow-sm h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>

                        {/* Export CSV Button */}
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            title="Export to CSV"
                        >
                            <Download className="w-4 h-4" />
                        </button>

                        {/* Invite Button - visible to Owner */}
                        {currentProject?.role === 'owner' && (
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center justify-center p-2 text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors shadow-sm h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                                title="Add Member"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        )}


                        {/* Month Filter Dropdown */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 appearance-none h-10 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                <option value="all">All Time</option>
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
                            expenses={selectedMonth === 'all' ? expenses : expenses.filter(e => e.date.startsWith(selectedMonth))}
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
                                // @ts-ignore - simplified type handling for this interaction
                                onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
                                onCancel={() => {
                                    setShowForm(false)
                                    setEditingExpense(null)
                                }}
                                totalSavings={totalSavings}
                            />
                        </Modal>

                        <Modal
                            isOpen={showInviteModal}
                            onClose={() => setShowInviteModal(false)}
                            title="Invite Member to Project"
                        >
                            <form onSubmit={handleInviteMember} className="space-y-4">
                                <div>
                                    <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Member Email
                                    </label>
                                    <input
                                        id="inviteEmail"
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder="user@example.com"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        User must already be registered in the app.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                    >
                                        Invite Member
                                    </button>
                                </div>
                            </form>
                        </Modal>

                        <ExpenseList
                            expenses={filteredExpenses}
                            onDelete={() => currentProject && fetchExpenses(currentProject.id)}
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

export default function ProjectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
            <ProjectContent />
        </Suspense>
    )
}

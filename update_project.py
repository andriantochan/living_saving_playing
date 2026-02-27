import re

with open('src/app/project/page.tsx', 'r') as f:
    content = f.read()

# 1. Update selectedMonth to allow 'all'
state_old = "const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)) // YYYY-MM"
state_new = "const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)) // YYYY-MM or 'all'"
content = content.replace(state_old, state_new)

# 2. Update filteredExpenses to handle 'all'
filter_old = """    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.date.startsWith(selectedMonth))
    }, [expenses, selectedMonth])"""
filter_new = """    const filteredExpenses = useMemo(() => {
        if (selectedMonth === 'all') return expenses
        return expenses.filter(e => e.date.startsWith(selectedMonth))
    }, [expenses, selectedMonth])"""
content = content.replace(filter_old, filter_new)

# 3. Update useMemo for totals to handle 'all'
totals_old = """    const { totalIncome, totalExpenses, balance, totalSavings, allTimeExpenses } = useMemo(() => {
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
            totalSavings: allTimeSavings,
            allTimeExpenses: allTimeExpense
        }
    }, [expenses, selectedMonth])"""
totals_new = """    const { totalIncome, totalExpenses, balance, totalSavings, allTimeExpenses } = useMemo(() => {
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
    }, [expenses, selectedMonth])"""
content = content.replace(totals_old, totals_new)

# 4. Remove allTimeExpenses from Dashboard props
dashboard_old = """                        <Dashboard
                            expenses={expenses}
                            onAddExpense={handleAddExpense}
                            totalIncome={totalIncome}
                            totalExpenses={totalExpenses}
                            balance={balance}
                            totalSavings={totalSavings}
                            allTimeExpenses={allTimeExpenses}
                        />"""
dashboard_new = """                        <Dashboard
                            expenses={selectedMonth === 'all' ? expenses : expenses.filter(e => e.date.startsWith(selectedMonth))}
                            onAddExpense={handleAddExpense}
                            totalIncome={totalIncome}
                            totalExpenses={totalExpenses}
                            balance={balance}
                            totalSavings={totalSavings}
                        />"""
content = content.replace(dashboard_old, dashboard_new)

# 5. Add "All Time" to dropdown
dropdown_old = """                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 appearance-none h-10 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                {availableMonths.map(month => (
                                    <option key={month} value={month}>
                                        {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>"""
dropdown_new = """                            <select
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
                            </select>"""
content = content.replace(dropdown_old, dropdown_new)


with open('src/app/project/page.tsx', 'w') as f:
    f.write(content)
print("Project updated")

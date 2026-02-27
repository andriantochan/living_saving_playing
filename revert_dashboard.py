import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Component signature
content = content.replace(
    "export function Dashboard({ expenses, onAddExpense, totalIncome, totalExpenses, balance, totalSavings, allTimeExpenses = 0 }: { expenses: Expense[], onAddExpense: (expense: Omit<Expense, 'id'>) => void, totalIncome: number, totalExpenses: number, balance: number, totalSavings: number, allTimeExpenses?: number }) {",
    "export function Dashboard({ expenses, onAddExpense, totalIncome, totalExpenses, balance, totalSavings }: { expenses: Expense[], onAddExpense: (expense: Omit<Expense, 'id'>) => void, totalIncome: number, totalExpenses: number, balance: number, totalSavings: number }) {"
)

# 2. Modify Expense Card
old_expense_bottom = """                        <div className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between items-center text-gray-400 dark:text-gray-500">
                                <span>Target: <span className="text-gray-600 dark:text-gray-300 ml-1 font-medium">{formatCurrency(budgetLimit)}</span></span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-1 mt-1">
                                <span>All Time: <span className="text-gray-600 dark:text-gray-300 ml-1 font-medium">{formatCurrency(allTimeExpenses)}</span></span>
                            </div>
                        </div>"""
new_expense_bottom = """                        <div className="flex items-center text-xs justify-between">
                            <span className="text-gray-400 dark:text-gray-500 flex items-center">
                                Target: <span className="text-gray-600 dark:text-gray-300 ml-1 font-medium">{formatCurrency(budgetLimit)}</span>
                            </span>
                        </div>"""
content = content.replace(old_expense_bottom, new_expense_bottom)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
print("Dashboard reverted")

import re

with open('src/components/ExpenseList.tsx', 'r') as f:
    content = f.read()

# 1. state and unique users
state_old = """    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filterCategory, setFilterCategory] = useState<'All' | 'Living' | 'Playing' | 'Saving' | 'Income'>('All')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

    const filteredExpenses = useMemo(() => {
        let result = [...expenses]

        // Filter
        if (filterCategory !== 'All') {"""
state_new = """    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filterCategory, setFilterCategory] = useState<'All' | 'Living' | 'Playing' | 'Saving' | 'Income'>('All')
    const [filterUser, setFilterUser] = useState<string>('All')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

    const uniqueUsers = useMemo(() => {
        const usersMap = new Map<string, string>()
        expenses.forEach(exp => {
            if (exp.user_id && exp.profiles) {
                const name = exp.profiles.full_name || exp.profiles.username || 'Unknown'
                usersMap.set(exp.user_id, name)
            }
        })
        return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }))
    }, [expenses])

    const filteredExpenses = useMemo(() => {
        let result = [...expenses]

        // Filter Category
        if (filterCategory !== 'All') {
            result = result.filter(exp => exp.category === filterCategory)
        }

        // Filter User
        if (filterUser !== 'All') {
            result = result.filter(exp => exp.user_id === filterUser)
        }

        // Avoid empty else if block structure that is confusing
        if (false) {"""
content = content.replace(state_old, state_new)

# filter user dependencies
dep_old = """    }, [expenses, filterCategory, sortOrder])"""
dep_new = """    }, [expenses, filterCategory, filterUser, sortOrder])"""
content = content.replace(dep_old, dep_new)

# 2. dropdown
dropdown_old = """                <div className="flex gap-2">
                    <select
                        value={filterCategory}"""
dropdown_new = """                <div className="flex gap-2 flex-wrap">
                    <select
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                        <option value="All">All People</option>
                        {uniqueUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterCategory}"""
content = content.replace(dropdown_old, dropdown_new)

with open('src/components/ExpenseList.tsx', 'w') as f:
    f.write(content)
print("ExpenseList updated")

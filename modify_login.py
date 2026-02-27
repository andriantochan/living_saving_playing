import re

with open('src/app/login/page.tsx', 'r') as f:
    content = f.read()

# 1. State
content = content.replace(
    "const [isSignUp, setIsSignUp] = useState(false)",
    "const [isSignUp, setIsSignUp] = useState(false)\n    const [isForgotPassword, setIsForgotPassword] = useState(false)"
)

# 2. handleAuth logic
handle_auth_start = """        try {
            if (isSignUp) {"""
handle_auth_replacement = """        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/update-password`,
                })
                if (error) {
                    toast.error(error.message)
                } else {
                    toast.success('Password reset link sent to your email')
                    setIsForgotPassword(false)
                    setEmail('')
                }
                setLoading(false)
                return
            }

            if (isSignUp) {"""
content = content.replace(handle_auth_start, handle_auth_replacement)

# 3. Headers
header_start = """                        {isSignUp ? (
                            <UserPlus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                            <LogIn className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {isSignUp ? 'Start tracking your financial goals' : 'Sign in to track your finances'}
                    </p>"""
header_replacement = """                        {isForgotPassword ? (
                            <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        ) : isSignUp ? (
                            <UserPlus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                            <LogIn className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {isForgotPassword ? 'Enter your email to receive a reset link' : isSignUp ? 'Start tracking your financial goals' : 'Sign in to track your finances'}
                    </p>"""
content = content.replace(header_start, header_replacement)

# 4. fullName
content = content.replace("{isSignUp && (", "{!isForgotPassword && isSignUp && (", 1)

# 5. username
username_start = """                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">"""
username_rep = """                        {!isForgotPassword && (
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">"""
content = content.replace(username_start, username_rep)

content = content.replace(
    'placeholder="johndoe"\n                                />\n                            </div>\n                        </div>',
    'placeholder="johndoe"\n                                />\n                            </div>\n                        </div>\n                        )}'
)
content = content.replace('required\n                                    value={username}', 'required={!isForgotPassword}\n                                    value={username}')

# 6. email
content = content.replace("{/* Email only needed for Sign Up */}\n                        {isSignUp && (", "{/* Email needed for Sign Up and Forgot Password */}\n                        {(isSignUp || isForgotPassword) && (")
content = content.replace("required={isSignUp}\n                                        value={email}", "required={isSignUp || isForgotPassword}\n                                        value={email}")

# 7. password
password_start = """                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">"""
password_rep = """                        {!isForgotPassword && (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">"""
content = content.replace(password_start, password_rep)
content = content.replace('placeholder="••••••••"\n                                />\n                            </div>\n                        </div>', 'placeholder="••••••••"\n                                />\n                            </div>\n                        </div>\n                        )}')
content = content.replace('required\n                                    value={password}', 'required={!isForgotPassword}\n                                    value={password}')


# 8. confirm password
content = content.replace("{isSignUp && (\n                            <div>\n                                <label htmlFor=\"confirmPassword\"", "{!isForgotPassword && isSignUp && (\n                            <div>\n                                <label htmlFor=\"confirmPassword\"")

# 9. bottom form
bottom_start = """                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                isSignUp ? 'Sign Up' : 'Sign In'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        >
                            {isSignUp ? 'Sign in' : 'Sign up'}
                        </button>
                    </p>
                </div>"""
bottom_rep = """                    </div>

                    {!isForgotPassword && !isSignUp && (
                        <div className="flex items-center justify-end mt-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Forgot your password?
                            </button>
                        </div>
                    )}

                    <div className={!isForgotPassword && !isSignUp ? "" : "mt-6"}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    {isForgotPassword ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Remember your password?{' '}
                            <button
                                onClick={() => setIsForgotPassword(false)}
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            >
                                Sign in
                            </button>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp)
                                    setIsForgotPassword(false)
                                }}
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            >
                                {isSignUp ? 'Sign in' : 'Sign up'}
                            </button>
                        </p>
                    )}
                </div>"""
content = content.replace(bottom_start, bottom_rep)

with open('src/app/login/page.tsx', 'w') as f:
    f.write(content)
print("done")

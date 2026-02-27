'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [status, setStatus] = useState('Verifying your email...')

    useEffect(() => {
        let mounted = true

        const handleEmailConfirmation = async () => {
            try {
                // Supabase-js automatically parses the URL hash (`#access_token=...`)
                // and establishes the session on initialization.
                // Or if PKCE is used, it exchanges the `?code=...` automatically normally.
                // We'll just wait a bit for supabase to initialize, then check session.

                // Allow some time for client-side storage to reflect the new session.
                setTimeout(async () => {
                    if (!mounted) return;

                    const { data: { session }, error } = await supabase.auth.getSession()

                    if (error) {
                        toast.error(error.message)
                        setStatus('Verification failed. Redirecting to login...')
                        setTimeout(() => router.push('/login'), 2000)
                        return
                    }

                    if (session) {
                        toast.success('Email verified successfully!')
                        setStatus('Verification complete. Redirecting...')

                        // We optionally can check if they are trying to reset password vs sign up
                        // Usually handled by redirect in email link. If they land here, it's just general callback
                        setTimeout(() => {
                            router.push('/home')
                            router.refresh()
                        }, 1000)
                    } else {
                        // Sometimes the session is not there but the confirmation succeeded 
                        // (e.g., if another tab handled it, or if it redirected without tokens)
                        setStatus('Redirecting to login...')
                        setTimeout(() => router.push('/login'), 1500)
                    }
                }, 1000)

            } catch (err: any) {
                console.error(err)
                if (mounted) {
                    setStatus('An error occurred during verification.')
                    setTimeout(() => router.push('/login'), 2000)
                }
            }
        }

        handleEmailConfirmation()

        return () => {
            mounted = false
        }
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-6">
                    <MailCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Authentication
                </h2>
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                        {status}
                    </p>
                </div>
            </div>
        </div>
    )
}

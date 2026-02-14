
import { createClient } from '@supabase/supabase-js'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate URL format
const isValidUrl = (url: string | undefined): boolean => {
    try {
        if (!url) return false
        return url.startsWith('http://') || url.startsWith('https://')
    } catch {
        return false
    }
}

const supabaseUrl = isValidUrl(envUrl) ? envUrl! : 'https://placeholder.supabase.co'
const supabaseAnonKey = envKey || 'placeholder-key'

if (typeof window !== 'undefined') {
    console.log('Supabase Config Debug:', {
        envUrlProvided: !!envUrl,
        isValid: isValidUrl(envUrl),
        usingUrl: supabaseUrl,
        keyProvided: !!envKey
    })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

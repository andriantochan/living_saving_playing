'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Modal } from '../../components/Modal'
import { LogOut, Plus, Folder, User, ArrowRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Project = {
    id: string
    name: string
    role: 'owner' | 'member'
    created_at: string
    owner_name: string | null
    owner_username: string | null
    last_expense_date: string | null
}

type UserProfile = {
    full_name: string | null
    username: string | null
}

export default function Home() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
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

            // Fetch all projects for the user
            fetchProjects(session.user.id)
        }
        init()
    }, [])

    const fetchProjects = async (userId: string) => {
        setLoading(true)

        // 1. Fetch memberships to get roles and project IDs
        const { data: members, error: membersError } = await supabase
            .from('project_members')
            .select('project_id, role')
            .eq('user_id', userId)

        if (membersError) {
            console.error('Error fetching members:', membersError)
            toast.error('Failed to load projects')
            setLoading(false)
            return
        }

        if (!members || members.length === 0) {
            setProjects([])
            setLoading(false)
            return
        }

        const projectIds = members.map(m => m.project_id)

        // 2. Fetch project details from the view
        const { data: details, error: detailsError } = await supabase
            .from('project_details_view')
            .select('*')
            .in('id', projectIds)
            .order('last_expense_date', { ascending: false }) // Sort by most active

        if (detailsError) {
            console.error('Error fetching details:', detailsError)
            toast.error('Failed to load project details')
        }

        // 3. Merge data
        const mergedProjects: Project[] = (details || []).map(detail => {
            const member = members.find(m => m.project_id === detail.id)
            return {
                id: detail.id,
                name: detail.name,
                role: member?.role || 'member',
                created_at: detail.created_at,
                owner_name: detail.owner_name,
                owner_username: detail.owner_username,
                last_expense_date: detail.last_expense_date
            }
        })

        setProjects(mergedProjects)
        setLoading(false)
    }

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newProjectName.trim()) return

        setIsCreating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Create Project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({ name: newProjectName, owner_id: user.id })
                .select()
                .single()

            if (projectError) throw projectError

            // 2. Add Member (Owner)
            const { error: memberError } = await supabase
                .from('project_members')
                .insert({ project_id: project.id, user_id: user.id, role: 'owner' })

            if (memberError) {
                console.warn("Possible duplicate member insertion or error", memberError)
            }

            toast.success('Project created successfully')
            setNewProjectName('')
            setShowCreateModal(false)

            if (project?.id) {
                console.log('Redirecting to project:', project.id)
                router.push(`/project?id=${project.id}`)
            } else {
                console.error("Created project but ID is missing:", project)
                toast.error("Project created provided no ID")
            }

        } catch (error: any) {
            console.error('Failed to create project:', error)
            toast.error('Failed to create project')
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault() // Prevent navigation to project
        e.stopPropagation()

        if (!confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all expenses associated with it.')) return

        try {
            const { error } = await supabase.from('projects').delete().eq('id', projectId)
            if (error) throw error
            toast.success('Project deleted successfully')
            fetchProjects((await supabase.auth.getUser()).data.user?.id || '')
        } catch (error) {
            console.error('Error deleting project:', error)
            toast.error('Failed to delete project')
        }
    }

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            toast.error('Error logging out')
        } else {
            router.push('/login')
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never'
        return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
                            <Folder className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">My Projects</h1>
                            {userProfile && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    {userProfile.full_name || userProfile.username || 'User'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Create New Project Card */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex flex-col items-center justify-center h-48 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-all group"
                        >
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Create New Project</span>
                        </button>

                        {projects.map((project) => (
                            <Link
                                href={`/project?id=${project.id}`}
                                key={project.id}
                                className="flex flex-col h-auto min-h-[12rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Folder className="w-24 h-24 text-indigo-600 transform rotate-12 translate-x-4 -translate-y-4" />
                                </div>

                                <div className="flex-1 relative z-10">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">{project.name}</h3>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>Created By</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{project.owner_name == userProfile?.full_name ? 'You' : project.owner_name || project.owner_username || 'Unknown'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>Created</span>
                                            <span>{formatDate(project.created_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>Last Update</span>
                                            <span className={project.last_expense_date ? "text-green-600 dark:text-green-400 font-medium" : ""}>{formatDate(project.last_expense_date)}</span>
                                        </div>
                                    </div>

                                </div>

                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50 relative z-10">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.role === 'owner'
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        }`}>
                                        {project.role}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:translate-x-1 transition-transform cursor-pointer">
                                            Open <ArrowRight className="w-4 h-4 ml-1" />
                                        </div>
                                        {project.role === 'owner' && (
                                            <button
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors ml-2"
                                                title="Delete Project"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </Link>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create New Project"
                >
                    <form onSubmit={handleCreateProject} className="space-y-4">
                        <div>
                            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Project Name
                            </label>
                            <input
                                id="projectName"
                                type="text"
                                required
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="My Awesome Project"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </main>
    )
}

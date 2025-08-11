"use client"

import React, { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Settings, User, Users, FileText, Palette, Image as ImageIcon, Save, Eye, EyeOff, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useApp } from '@/contexts/app-context'
import { useAuth } from '@/hooks/use-auth'
import { ColorPicker } from '@/components/color-picker'
import { getStatusColor } from '@/lib/utils'
import { adminTicketsApi, themeApi, logoSettingsApi } from '@/lib/api'

interface SystemAdminModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AdminUser {
  id: string
  name: string
  email: string
  avatar?: string
}

const ProgressBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={`text-xs font-medium ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </Badge>
  )
}

export function SystemAdminModal({ isOpen, onClose }: SystemAdminModalProps) {
  const { themeColors, updateThemeColors, adminTickets, logo, updateLogo, systemAdmins, addSystemAdmin, removeSystemAdmin, loadAdminTickets, updateAdminTickets } = useApp()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [logoRedirectUrl, setLogoRedirectUrl] = useState(logo?.redirectUrl || '')
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [removeAdminConfirmId, setRemoveAdminConfirmId] = useState<string | null>(null)
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<string | null>(null)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update logoRedirectUrl when logo changes
  React.useEffect(() => {
    setLogoRedirectUrl(logo?.redirectUrl || '')
  }, [logo])

  // Load tickets when modal opens
  React.useEffect(() => {
    if (isOpen) {
      handleLoadTickets()
      handleLoadThemeColors()
    } else {
      // Clear confirmation states when modal closes
      setDeleteConfirmId(null)
      setRemoveAdminConfirmId(null)
      setUpdatingVisibilityId(null)
      setDeletingTicketId(null)
    }
  }, [isOpen])

  // Load tickets when switching to requests tab
  React.useEffect(() => {
    if (isOpen && activeTab === 'requests') {
      handleLoadTickets()
    }
  }, [isOpen, activeTab])

  // Filter suggestions based on search query
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return adminTickets
    
    const query = searchQuery.toLowerCase()
    return adminTickets.filter(suggestion => 
      suggestion.title.toLowerCase().includes(query) ||
      suggestion.description.toLowerCase().includes(query) ||
      suggestion.status.toLowerCase().includes(query)
    )
  }, [adminTickets, searchQuery])

  // Calculate ticket statistics
  const ticketStats = useMemo(() => {
    const stats = {
      total: adminTickets.length,
      queued: adminTickets.filter(t => t.status === 'Queued').length,
      inProgress: adminTickets.filter(t => t.status === 'In Progress').length,
      completed: adminTickets.filter(t => t.status === 'Completed').length,
      hidden: adminTickets.filter(t => t.hidden).length
    }
    return stats
  }, [adminTickets])

  const handleSave = async (tab: string) => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      switch (tab) {
        case 'general':
          // Save theme colors and logo settings
          try {
            // Save theme colors to backend
            const themeResult = await themeApi.saveThemeColors(themeColors)
            if (themeResult.error) {
              throw new Error(themeResult.error)
            }
            
            if (logo) {
              // Logo is already saved when uploaded, just update any redirect URL changes
              console.log('Logo settings saved:', logo)
              
              // Update logo with current redirect URL if it changed
              if (logo.redirectUrl !== logoRedirectUrl) {
                try {
                  const logoResult = await logoSettingsApi.updateLogoSettings({ redirectUrl: logoRedirectUrl || undefined })
                  if (logoResult.error) {
                    throw new Error(logoResult.error)
                  }
                  
                  updateLogo({
                    ...logo,
                    redirectUrl: logoRedirectUrl || undefined
                  })
                } catch (error) {
                  console.error('Error saving logo settings:', error)
                  throw error
                }
              }
            }
            console.log('Theme colors saved:', themeColors)
          } catch (error) {
            console.error('Error saving theme colors:', error)
            throw error
          }
          break
        case 'profile':
          // Save profile settings
          try {
            // In a real implementation, you'd save this to your database
            // For now, we'll just log the changes
            console.log('Profile settings saved:', { displayName })
            
            // Show success message
            setSaveMessage({ type: 'success', message: 'Profile settings saved successfully!' })
            setTimeout(() => setSaveMessage(null), 3000)
          } catch (error) {
            console.error('Error saving profile settings:', error)
            throw error
          }
          break
        case 'users':
          // System admin changes are already handled by the individual functions
          // (addSystemAdmin, removeSystemAdmin) so we don't need to do anything here
          console.log('System admin changes saved')
          break
        case 'requests':
          // Request changes are already handled by the individual functions
          // (handleToggleVisibility, handleDeleteRequest) so we don't need to do anything here
          console.log('Request changes saved')
          break
      }
      
      setSaveMessage({ type: 'success', message: 'Settings saved successfully!' })
    } catch {
      setSaveMessage({ type: 'error', message: 'Failed to save settings. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadTickets = async () => {
    setIsLoadingTickets(true)
    try {
      await loadAdminTickets()
    } catch (error) {
      console.error('Error loading admin tickets:', error)
    } finally {
      setIsLoadingTickets(false)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      // Set loading state for this specific ticket
      setDeletingTicketId(requestId)
      
      // Store original state before optimistic update
      const originalTickets = [...adminTickets]
      
      // Optimistically remove the ticket from the UI
      const updatedTickets = adminTickets.filter(ticket => ticket.id !== requestId)
      updateAdminTickets(updatedTickets)
      
      console.log('Attempting to delete ticket:', requestId)
      
      // Use the dedicated admin API to delete the ticket
      const result = await adminTicketsApi.deleteTicket(requestId)
      
      console.log('Delete API result:', result)
      
      if (result.error) {
        // Revert optimistic update on error
        updateAdminTickets(originalTickets) // Revert to original state
        console.error('Delete API returned error:', result.error)
        throw new Error(result.error)
      }
      
      // Show success message
      setSaveMessage({ type: 'success', message: 'Request deleted successfully!' })
      setTimeout(() => setSaveMessage(null), 3000)
      
      // Clear confirmation state
      setDeleteConfirmId(null)
      
      // No need to reload tickets since we already updated them optimistically
    } catch (error) {
      console.error('Error deleting request:', error)
      setSaveMessage({ type: 'error', message: 'Failed to delete request. Please try again.' })
      setTimeout(() => setSaveMessage(null), 3000)
      
      // Refresh tickets to revert any optimistic changes
      await handleLoadTickets()
    } finally {
      // Clear loading state
      setDeletingTicketId(null)
    }
  }

  const handleToggleVisibility = async (requestId: string) => {
    try {
      const suggestion = adminTickets.find(s => s.id === requestId)
      if (suggestion) {
        // Set loading state for this specific ticket
        setUpdatingVisibilityId(requestId)
        
        // Store original state before optimistic update
        const originalTickets = [...adminTickets]
        
        // Optimistically update the UI
        const updatedTickets = adminTickets.map(ticket => 
          ticket.id === requestId 
            ? { ...ticket, hidden: !ticket.hidden }
            : ticket
        )
        
        // Update the context with optimistic data
        updateAdminTickets(updatedTickets)
        
        // Use the dedicated admin API to toggle visibility
        const result = await adminTicketsApi.toggleVisibility(requestId, !suggestion.hidden)
        
        if (result.error) {
          // Revert optimistic update on error
          updateAdminTickets(originalTickets) // Revert to original state
          throw new Error(result.error)
        }
        
        // Show success message
        const action = suggestion.hidden ? 'shown' : 'hidden'
        setSaveMessage({ type: 'success', message: `Request ${action} successfully!` })
        setTimeout(() => setSaveMessage(null), 3000)
        
        // No need to reload tickets since we already updated them optimistically
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      setSaveMessage({ type: 'error', message: 'Failed to toggle visibility. Please try again.' })
      setTimeout(() => setSaveMessage(null), 3000)
      
      // Refresh tickets to revert any optimistic changes
      await handleLoadTickets()
    } finally {
      // Clear loading state
      setUpdatingVisibilityId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select only image files')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsLogoUploading(true)
    setSaveMessage(null)
    
    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      if (logoRedirectUrl) {
        formData.append('redirectUrl', logoRedirectUrl)
      }

      // Upload to Supabase storage via our API
      const response = await fetch('/api/admin/logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to upload logo'
        console.error('Upload failed:', errorMessage)
        throw errorMessage
      }

      const result = await response.json()
      
      if (result.success) {
        // Update logo with the permanent URL from storage
        updateLogo(result.logo)
        
        // Show success message
        setSaveMessage({ type: 'success', message: 'Logo uploaded successfully!' })
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        throw 'Upload failed'
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      setSaveMessage({ 
        type: 'error', 
        message: typeof error === 'string' ? error : 'Failed to upload logo. Please try again.' 
      })
    } finally {
      setIsLogoUploading(false)
    }
  }

  const handleLogoRedirectUrlChange = (url: string) => {
    setLogoRedirectUrl(url)
    if (logo) {
      updateLogo({
        ...logo,
        redirectUrl: url || undefined
      })
    }
  }
  
  const handleRemoveLogo = () => {
    updateLogo({ url: '', redirectUrl: undefined })
    setLogoRedirectUrl('')
    setSaveMessage({ type: 'success', message: 'Logo removed successfully!' })
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return
    
    try {
      await addSystemAdmin(newAdminEmail.trim())
      setNewAdminEmail('')
      // Show success message
      setSaveMessage({ type: 'success', message: 'Administrator added successfully!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Failed to add administrator. Please try again.' })
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    try {
      await removeSystemAdmin(adminId)
      // Show success message
      setSaveMessage({ type: 'success', message: 'Administrator removed successfully!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Failed to remove administrator. Please try again.' })
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }



  const handleLoadThemeColors = async () => {
    try {
      const result = await themeApi.getThemeColors()
      if (result.data && !result.error) {
        updateThemeColors(result.data)
      }
    } catch (error) {
      console.error('Error loading theme colors:', error)
      // Keep current theme colors if loading fails
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[80vw] h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              System Administration
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 pt-4 flex-shrink-0">
                <TabsList className="flex w-auto bg-transparent p-0 space-x-5 justify-start">
                  <TabsTrigger 
                    value="general" 
                    className="flex items-center space-x-2 bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md px-3 py-2 transition-colors text-gray-400 dark:text-gray-500 flex-none"
                  >
                    <Settings className="w-4 h-4" />
                    <span>General</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="flex items-center space-x-2 bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md px-3 py-2 transition-colors text-gray-400 dark:text-gray-500 flex-none"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users" 
                    className="flex items-center space-x-2 bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md px-3 py-2 transition-colors text-gray-400 dark:text-gray-500 flex-none"
                  >
                    <Users className="w-4 h-4" />
                    <span>Admin Users</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="requests" 
                    className="flex items-center space-x-2 bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md px-3 py-2 transition-colors text-gray-400 dark:text-gray-500 flex-none"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Manage Requests</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {/* General Tab */}
                <TabsContent value="general" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      Theme Colors
                    </h3>
                    <div className="space-y-4">
                      <ColorPicker
                        label="Primary Color"
                        value={themeColors.primary}
                        onChange={(color) => updateThemeColors({ primary: color })}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      Logo
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                            {logo?.url ? (
                              <img 
                                src={logo.url} 
                                alt="Logo" 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-2xl font-bold">B</span>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLogoUploading}
                                className="flex items-center space-x-2"
                              >
                                {isLogoUploading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Logo</span>
                                  </>
                                )}
                              </Button>
                              
                              {logo?.url && (
                                <Button 
                                  variant="outline" 
                                  onClick={handleRemoveLogo}
                                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                  Remove Logo
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Redirect URL Input */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Redirect on Click
                        </label>
                        <Input 
                          placeholder="Insert your URL" 
                          value={logoRedirectUrl}
                          onChange={(e) => handleLogoRedirectUrlChange(e.target.value)}
                        />
                      </div>
                      

                    </div>
                  </div>
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Profile Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                          <Button variant="outline">
                            Change Profile Picture
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Display Name
                        </label>
                        <Input 
                          placeholder="Enter display name" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">System Administrators</h3>
                    
                    {/* Add New Admin */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-2">Add New Administrator</h4>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter email address"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleAddAdmin}>Add Admin</Button>
                      </div>
                    </div>

                    {/* Current Admins */}
                    <div className="space-y-2">
                      {systemAdmins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-sm text-gray-500">{admin.email}</p>
                            </div>
                          </div>
                          {user?.email === admin.email ? (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Current User</span>
                          ) : removeAdminConfirmId === admin.id ? (
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700" 
                                onClick={() => handleRemoveAdmin(admin.id)}
                              >
                                Confirm
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setRemoveAdminConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700" 
                              onClick={() => setRemoveAdminConfirmId(admin.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Requests Tab */}
                <TabsContent value="requests" className="space-y-6">
                  <div>
                    {/* Header with Search */}
                    <div className="mb-4">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input 
                          placeholder="Search feature requests..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                    </div>

                    {/* Requests List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {isLoadingTickets ? (
                        <div className="text-center py-8 text-gray-500">
                          Loading feature requests...
                        </div>
                      ) : filteredSuggestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No feature requests found.
                        </div>
                      ) : (
                        filteredSuggestions.map((suggestion) => (
                          <div key={suggestion.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex-1 mr-4">
                              <div className="mb-2">
                                <ProgressBadge status={suggestion.status} />
                              </div>
                              <h4 className="font-medium">{suggestion.title}</h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion.description}</p>

                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleToggleVisibility(suggestion.id)}
                                className="text-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                                title={suggestion.hidden ? 'Show ticket' : 'Hide ticket'}
                                disabled={updatingVisibilityId === suggestion.id}
                              >
                                {updatingVisibilityId === suggestion.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                    <span className="ml-1">Updating...</span>
                                  </>
                                ) : (
                                  <>
                                    {!suggestion.hidden ? (
                                      <>
                                        <EyeOff className="w-4 h-4" />
                                        <span className="ml-1">Hide</span>
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-4 h-4" />
                                        <span className="ml-1">Show</span>
                                      </>
                                    )}
                                  </>
                                )}
                              </Button>
                              {deleteConfirmId === suggestion.id ? (
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDeleteRequest(suggestion.id)}
                                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                    disabled={deletingTicketId === suggestion.id}
                                  >
                                    {deletingTicketId === suggestion.id ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                        <span>Deleting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>Confirm</span>
                                      </>
                                    )}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setDeleteConfirmId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setDeleteConfirmId(suggestion.id)}
                                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                  title="Delete ticket"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer with Save Changes Button */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              {saveMessage && (
                <div className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage.message}
                </div>
              )}
              <div className="flex space-x-2 ml-auto">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSave(activeTab)}
                  disabled={isSaving}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 
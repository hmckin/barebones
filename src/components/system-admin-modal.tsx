"use client"

import React, { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, User, Users, FileText, Palette, Image as ImageIcon, Save, Eye, EyeOff, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useApp } from '@/contexts/app-context'
import { ColorPicker } from '@/components/color-picker'
import { getStatusColor } from '@/lib/utils'

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

const mockAdmins: AdminUser[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '/api/placeholder/32/32' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: '/api/placeholder/32/32' },
]

const ProgressBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={`text-xs font-medium ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </Badge>
  )
}

export function SystemAdminModal({ isOpen, onClose }: SystemAdminModalProps) {
  const { themeColors, updateThemeColors, suggestions, updateSuggestionStatus, logo, updateLogo } = useApp()
  const [activeTab, setActiveTab] = useState('general')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [hiddenRequests, setHiddenRequests] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [logoRedirectUrl, setLogoRedirectUrl] = useState(logo?.redirectUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update logoRedirectUrl when logo changes
  React.useEffect(() => {
    setLogoRedirectUrl(logo?.redirectUrl || '')
  }, [logo])

  // Filter suggestions based on search query
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return suggestions
    
    const query = searchQuery.toLowerCase()
    return suggestions.filter(suggestion => 
      suggestion.title.toLowerCase().includes(query) ||
      suggestion.description.toLowerCase().includes(query) ||
      suggestion.status.toLowerCase().includes(query)
    )
  }, [suggestions, searchQuery])

  const handleSave = async (tab: string) => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // TODO: Replace with actual API calls
      switch (tab) {
        case 'general':
          // PATCH /api/admin/settings/colors, PATCH /api/admin/settings/logo
          break
        case 'profile':
          // PATCH /api/admin/profile
          break
        case 'users':
          // PATCH /api/admin/users
          break
        case 'requests':
          // PATCH /api/admin/requests/status
          break
      }
      
      setSaveMessage({ type: 'success', message: 'Settings saved successfully!' })
    } catch {
      setSaveMessage({ type: 'error', message: 'Failed to save settings. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleDeleteRequest = (requestId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete request:', requestId)
  }

  const handleToggleVisibility = (requestId: string) => {
    setHiddenRequests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(requestId)) {
        newSet.delete(requestId)
      } else {
        newSet.add(requestId)
      }
      return newSet
    })
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Create object URL for preview
    const url = URL.createObjectURL(file)
    
    const newLogo = {
      url: url,
      redirectUrl: logoRedirectUrl || undefined
    }

    updateLogo(newLogo)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
                    <span>Users</span>
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
                            <Button 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center space-x-2"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Upload Logo</span>
                            </Button>
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
                        <Input placeholder="Enter display name" />
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
                        <Button>Add Admin</Button>
                      </div>
                    </div>

                    {/* Current Admins */}
                    <div className="space-y-2">
                      {mockAdmins.map((admin) => (
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
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Requests Tab */}
                <TabsContent value="requests" className="space-y-6">
                  <div>
                    {/* Search/Filter */}
                    <div className="mb-4 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input 
                        placeholder="Search feature requests..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Requests List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg relative">
                          {/* Action buttons positioned at top right */}
                          <div className="absolute top-2 right-2 flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleToggleVisibility(suggestion.id)}
                              className={hiddenRequests.has(suggestion.id) ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-gray-700"}
                            >
                              {hiddenRequests.has(suggestion.id) ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-1" />
                                  Show
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Hide
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteRequest(suggestion.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                          
                          <div className="flex-1 pr-48">
                            {/* Badge above title - matching expanded view */}
                            <div className="mb-2">
                              <ProgressBadge status={suggestion.status} />
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{suggestion.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                      ))}
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
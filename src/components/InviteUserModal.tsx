// src\components\InviteUserModal.tsx
'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserInvited: () => void
}

const ROLES = [
  'admin',
  'manager',
  'cleaner',
  'cleaner Manager',
  'viewer',
  'Client'
]

export default function InviteUserModal({
  isOpen,
  onClose,
  onUserInvited,
}: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('manager')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async () => {
    setSending(true)
    setError('')

    const trimmedEmail = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email format.')
      setSending(false)
      return
    }

    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(trimmedEmail)

    if (inviteError || !data?.user) {
      setError(inviteError?.message || 'Invitation failed')
      setSending(false)
      return
    }

    const { error: insertError } = await supabase.from('user_roles').insert({
      user_id: data.user.id,
      role,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      // Clear form, close modal, and refresh user list
      setEmail('')
      setRole('manager')
      onClose()
      onUserInvited?.()
    }

    setSending(false)
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    >
      <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md">
        <Dialog.Title className="text-xl font-bold mb-4">Invite New User</Dialog.Title>

        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded px-2 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={sending || !email}>
            {sending ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}

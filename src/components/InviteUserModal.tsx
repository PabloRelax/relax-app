// src\components\InviteUserModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import  supabase  from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserInvited: () => void
}

export default function InviteUserModal({
  isOpen,
  onClose,
  onUserInvited,
}: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('manager')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
  // 👇 Load roles from Supabase
  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_role_types')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching roles:', error);
      } else {
        setAvailableRoles(data);
        if (data.length > 0 && !role) setRole(data[0].id); // default role
      }
    };

    fetchRoles();
  }, []);

  const handleInvite = async () => {
    setSending(true)
    setError('')

    const trimmedEmail = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email format.')
      setSending(false)
      return
    }

    const {
      data: { user: currentUser },
      error: sessionError
    } = await supabase.auth.getUser();

    if (sessionError || !currentUser) {
      setError('Unable to determine current platform user.');
      setSending(false);
      return;
    }

    const response = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmedEmail,
        role_type_id: role,
        platform_user_id: currentUser.id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Invite failed:', result);
      setError(result.error || 'Invite failed');
    } else {
      // Clear form, close modal, and refresh user list
      setEmail('');
      setRole('manager');
      onClose();
      onUserInvited?.();
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
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
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

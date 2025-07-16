// src\app\users\page.tsx
'use client'

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import InviteUserModal from '@/components/InviteUserModal';
import DashboardLayout from '@/components/DashboardLayout';

const supabase = createClientComponentClient<Database>();

type User = {
  user_id: string;
  email: string;
  role: string;
};

const USERS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchUsers() {
    setLoading(true);
    
    try {
      const { data: users, error } = await supabase
        .from('users_view')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedUsers = users
        .filter(user => user.id !== null)
        .map(user => ({
          user_id: user.id as string,
          email: user.email || '—',
          role: user.role || '—'
        }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, users]);

  // Pagination logic
  const indexOfLastUser = currentPage * USERS_PER_PAGE;
  const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        // TODO: Implement actual user deletion
        // @ts-expect-error - 'users' table not in current Database type
        await supabase.from('users').delete().eq('id', userId);
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <Button onClick={() => setIsModalOpen(true)}>Add User</Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="py-4 text-gray-500">No users found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Role</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td className="px-4 py-2 text-sm text-gray-800">{user.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{user.role}</td>
                      <td className="px-4 py-2 text-sm text-gray-800 space-x-2">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
        <InviteUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUserInvited={fetchUsers}
        />
      </div>
    </DashboardLayout>
  );
}
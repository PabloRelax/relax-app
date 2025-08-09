// src/app/settings/page.ts
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabase/client';
import type { Tables } from 'types/supabase';

const MODULES = ['tasks', 'cleaners', 'properties'];
const ACTIONS = ['view', 'edit'];
const SCOPES = ['none', 'mine', 'all'];

type RoleType = Tables<'user_role_types'>;

type Permissions = {
  [module: string]: {
    [action: string]: 'none' | 'mine' | 'all';
  };
};

export default function SettingsPage() {
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, Permissions>>({});

  useEffect(() => {
    async function loadRoles() {
      const { data, error } = await supabase
        .from('user_role_types')
        .select('*');

      if (!error && data) {
        setRoles(data);
        const drafts: Record<string, Permissions> = {};
        data.forEach((r) => {
          drafts[r.id] = r.permissions || {};
        });
        setPermissionDrafts(drafts);
      }
    }
    loadRoles();
  }, []);

  const updatePermission = (roleId: string, module: string, action: string, scope: 'none' | 'mine' | 'all') => {
    setPermissionDrafts((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [module]: {
          ...prev[roleId]?.[module],
          [action]: scope,
        },
      },
    }));
  };

  const savePermissions = async (roleId: string) => {
    const { error } = await supabase
      .from('user_role_types')
      .update({ permissions: permissionDrafts[roleId] })
      .eq('id', roleId);

    if (!error) {
      setEditing(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Role Permissions</h1>

      {roles.map((role) => (
        <Card key={role.id} className="p-4">
          <CardContent className="space-y-2">
            <h2 className="text-lg font-semibold">{role.name}</h2>
            {MODULES.map((module) => (
              <div key={module} className="space-y-1">
                <Label className="font-medium">{module}</Label>
                <div className="flex gap-4">
                  {ACTIONS.map((action) => (
                    <div key={action} className="flex flex-col items-start text-sm">
                      <Label>{action}</Label>
                      <select
                        className="border rounded px-2 py-1"
                        value={permissionDrafts[role.id]?.[module]?.[action] || 'none'}
                        onChange={(e) => updatePermission(role.id, module, action, e.target.value as any)}
                      >
                        {SCOPES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {editing === role.id ? (
              <div className="mt-4 space-x-2">
                <Button onClick={() => savePermissions(role.id)}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            ) : (
              <Button className="mt-4" onClick={() => setEditing(role.id)}>Edit Permissions</Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

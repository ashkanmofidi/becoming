'use client';

import { useState, useEffect } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  sessions: number;
  health: string;
}

/**
 * User Management page. PRD Section 10.9.
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin?view=users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  const healthColor: Record<string, string> = {
    thriving: 'text-green-400',
    healthy: 'text-teal',
    at_risk: 'text-yellow-400',
    churning: 'text-orange-400',
    dormant: 'text-red-400',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">User Management</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-900/50 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-900 text-surface-500 text-xs font-mono uppercase tracking-wider">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Email</th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Joined</th>
                <th className="text-left py-3 px-2">Last Active</th>
                <th className="text-left py-3 px-2">Sessions</th>
                <th className="text-left py-3 px-2">Health</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-surface-900/50 hover:bg-surface-900/30">
                  <td className="py-3 px-2 text-surface-100">{user.name}</td>
                  <td className="py-3 px-2 text-surface-300 text-xs font-mono">{user.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                      user.role === 'super_admin' ? 'bg-red-900/30 text-red-400'
                      : user.role === 'admin' ? 'bg-amber/20 text-amber'
                      : 'bg-surface-700 text-surface-300'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-surface-500 text-xs">{new Date(user.joinedAt).toLocaleDateString()}</td>
                  <td className="py-3 px-2 text-surface-500 text-xs">{new Date(user.lastActive).toLocaleDateString()}</td>
                  <td className="py-3 px-2 text-surface-300 font-mono">{user.sessions}</td>
                  <td className={`py-3 px-2 text-xs font-mono uppercase ${healthColor[user.health] ?? 'text-surface-500'}`}>
                    {user.health}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

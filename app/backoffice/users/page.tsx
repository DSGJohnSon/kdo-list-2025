'use client';

import { useEffect, useState } from 'react';
import { supabase, User } from '@/lib/supabase';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHexKey = () => {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    setCreating(true);
    try {
      const hexKey = generateHexKey();

      const { data, error } = await supabase
        .from('users')
        .insert({
          name: newUserName.trim(),
          hex_key: hexKey,
        })
        .select()
        .single();

      if (error) throw error;

      setUsers([data, ...users]);
      setNewUserName('');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Échec de la création de l\'utilisateur');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Lien copié dans le presse-papiers !');
  };

  const getUserLink = (hexKey: string) => {
    return `${window.location.origin}/gifts/${hexKey}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Générer et gérer les liens d'accès utilisateur
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          {showForm ? '✕ Annuler' : '➕ Générer un nouveau lien'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Générer un nouveau lien utilisateur
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nom de l'utilisateur *
              </label>
              <input
                type="text"
                id="userName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Entrez le nom (ex: Maman, Papa, Soeur)"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              {creating ? 'Génération...' : 'Générer le lien'}
            </button>
          </form>
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucun utilisateur pour le moment
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Générez votre premier lien d'accès utilisateur
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Générer le premier lien
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {user.name}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Clé hexadécimale :
                      </p>
                      <code className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded font-mono text-gray-800 dark:text-gray-200">
                        {user.hex_key}
                      </code>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Lien d'accès :
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                          {getUserLink(user.hex_key)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(getUserLink(user.hex_key))}
                          className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap"
                        >
                          📋 Copier
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Créé le : {new Date(user.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
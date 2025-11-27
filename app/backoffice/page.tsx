'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function BackofficeDashboard() {
  const [stats, setStats] = useState({
    totalGifts: 0,
    totalUsers: 0,
    totalInterests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [giftsResult, usersResult, interestsResult] = await Promise.all([
        supabase.from('gifts').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('interests').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalGifts: giftsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalInterests: interestsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Cadeaux',
      value: stats.totalGifts,
      icon: '🎁',
      color: 'bg-blue-500',
      link: '/backoffice/gifts',
    },
    {
      title: 'Total Utilisateurs',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-green-500',
      link: '/backoffice/users',
    },
    {
      title: 'Total Intérêts',
      value: stats.totalInterests,
      icon: '❤️',
      color: 'bg-purple-500',
      link: null,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tableau de bord
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bienvenue dans le panneau d'administration de la liste cadeaux
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div
                className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}
              >
                {card.icon}
              </div>
            </div>
            {card.link && (
              <Link
                href={card.link}
                className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Voir tout →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/backoffice/gifts/new"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Ajouter un cadeau
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Créer une nouvelle entrée de cadeau
              </p>
            </div>
          </Link>
          <Link
            href="/backoffice/users"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800"
          >
            <span className="text-2xl mr-3">🔗</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Générer un lien utilisateur
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Créer un nouveau lien d'accès utilisateur
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
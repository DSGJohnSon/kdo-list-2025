'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Gift } from '@/lib/supabase';

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGifts(data || []);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cadeau ?')) return;

    setDeleting(id);
    try {
      const { error } = await supabase.from('gifts').delete().eq('id', id);

      if (error) throw error;
      setGifts(gifts.filter((gift) => gift.id !== id));
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Échec de la suppression du cadeau');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des cadeaux...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des cadeaux
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérer tous les cadeaux
          </p>
        </div>
        <Link
          href="/backoffice/gifts/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          ➕ Ajouter un cadeau
        </Link>
      </div>

      {gifts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucun cadeau pour le moment
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Commencez par ajouter votre premier cadeau
          </p>
          <Link
            href="/backoffice/gifts/new"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Ajouter le premier cadeau
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              {gift.image_url && (
                <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={gift.image_url}
                    alt={gift.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {gift.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {gift.description}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {gift.price.toFixed(2)} €
                  </span>
                  {gift.categories && gift.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {gift.categories.slice(0, 2).map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                        >
                          {cat}
                        </span>
                      ))}
                      {gift.categories.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300">
                          +{gift.categories.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/backoffice/gifts/${gift.id}/edit`}
                    className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(gift.id)}
                    disabled={deleting === gift.id}
                    className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    {deleting === gift.id ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
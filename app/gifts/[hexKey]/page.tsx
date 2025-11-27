'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Gift, User } from '@/lib/supabase';
import { Gift as GiftIcon, ShoppingCart, Heart, X, ArrowUpDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type GiftWithInterest = Gift & {
  interested_users?: { user_id: string; user_name: string }[];
  current_user_interested?: boolean;
};

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'category';

export default function GiftsListPage() {
  const params = useParams();
  const hexKey = params.hexKey as string;

  const [user, setUser] = useState<User | null>(null);
  const [gifts, setGifts] = useState<GiftWithInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [categories, setCategories] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftWithInterest | null>(null);

  useEffect(() => {
    loadUserAndGifts();
  }, [hexKey]);

  const loadUserAndGifts = async () => {
    try {
      // Load user by hex key
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('hex_key', hexKey)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Load all gifts
      const { data: giftsData, error: giftsError } = await supabase
        .from('gifts')
        .select('*')
        .order('created_at', { ascending: false });

      if (giftsError) throw giftsError;

      // Load all interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select(`
          id,
          gift_id,
          user_id,
          users (name)
        `);

      if (interestsError) throw interestsError;

      // Combine gifts with interest information
      const giftsWithInterests: GiftWithInterest[] = (giftsData || []).map((gift) => {
        const giftInterests = (interestsData || []).filter(
          (interest: any) => interest.gift_id === gift.id
        );

        const interestedUsers = giftInterests.map((interest: any) => ({
          user_id: interest.user_id,
          user_name: interest.users?.name || 'Unknown',
        }));

        const currentUserInterested = giftInterests.some(
          (interest: any) => interest.user_id === userData.id
        );

        return {
          ...gift,
          interested_users: interestedUsers,
          current_user_interested: currentUserInterested,
        };
      });

      setGifts(giftsWithInterests);

      // Extract unique categories
      const allCategories = new Set<string>();
      giftsWithInterests.forEach((gift) => {
        gift.categories?.forEach((cat) => allCategories.add(cat));
      });
      setCategories(Array.from(allCategories).sort());
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Lien d\'accès invalide ou erreur lors du chargement des cadeaux');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = async (giftId: string) => {
    if (!user) return;

    const gift = gifts.find((g) => g.id === giftId);
    if (!gift) return;

    // If gift is already reserved by someone else, show confirmation dialog
    if (!gift.current_user_interested && gift.interested_users && gift.interested_users.length > 0) {
      setSelectedGift(gift);
      setShowConfirmDialog(true);
      return;
    }

    // Otherwise, proceed with toggle
    await performToggleInterest(giftId);
  };

  const performToggleInterest = async (giftId: string) => {
    if (!user) return;

    const gift = gifts.find((g) => g.id === giftId);
    if (!gift) return;

    try {
      if (gift.current_user_interested) {
        // Remove interest
        const { error } = await supabase
          .from('interests')
          .delete()
          .eq('gift_id', giftId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add interest
        const { error } = await supabase
          .from('interests')
          .insert({
            gift_id: giftId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // Reload gifts to update UI
      await loadUserAndGifts();
      setShowConfirmDialog(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error toggling interest:', error);
      alert('Échec de la mise à jour de l\'intérêt');
    }
  };

  const getSortedAndFilteredGifts = () => {
    // Filter by category
    let filtered = selectedCategory === 'all'
      ? gifts
      : gifts.filter((gift) => gift.categories?.includes(selectedCategory));

    // Sort gifts with smart logic
    const sorted = [...filtered].sort((a, b) => {
      // 1. My reserved items first
      if (a.current_user_interested && !b.current_user_interested) return -1;
      if (!a.current_user_interested && b.current_user_interested) return 1;

      // 2. Items reserved by others go to the bottom
      const aReservedByOthers = a.interested_users && a.interested_users.length > 0 && !a.current_user_interested;
      const bReservedByOthers = b.interested_users && b.interested_users.length > 0 && !b.current_user_interested;
      
      if (aReservedByOthers && !bReservedByOthers) return 1;
      if (!aReservedByOthers && bReservedByOthers) return -1;

      // 3. Apply selected sort
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'category':
          const catA = a.categories?.[0] || '';
          const catB = b.categories?.[0] || '';
          return catA.localeCompare(catB);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredGifts = getSortedAndFilteredGifts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des cadeaux...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Lien d'accès invalide
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ce lien n'est pas valide ou a expiré
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <GiftIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Liste Cadeaux 2025
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Bienvenue, <span className="font-semibold">{user.name}</span> !
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Sort */}
        <div className="mb-6 space-y-4">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Filtrer par catégorie
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Tous ({gifts.length})
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category} ({gifts.filter((g) => g.categories?.includes(category)).length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Trier par
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy('default')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'default'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Par défaut
              </button>
              <button
                onClick={() => setSortBy('price-asc')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'price-asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Prix croissant
              </button>
              <button
                onClick={() => setSortBy('price-desc')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'price-desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Prix décroissant
              </button>
              <button
                onClick={() => setSortBy('category')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'category'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Par catégorie
              </button>
            </div>
          </div>
        </div>

        {/* Gifts Grid */}
        {filteredGifts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <GiftIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun cadeau disponible
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Revenez plus tard pour de nouvelles idées cadeaux !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => (
              <div
                key={gift.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-4 transition-all relative ${
                  gift.current_user_interested
                    ? 'border-green-500 shadow-green-200 shadow-2xl'
                    : gift.interested_users && gift.interested_users.length > 0
                    ? 'border-orange-500 shadow-orange-200 shadow-2xl'
                    : 'border-gray-200 dark:border-gray-700 hover:shadow-xl'
                }`}
              >
                {/* Status Badge - Very Visible */}
                {gift.current_user_interested && (
                  <div className="absolute top-0 left-0 right-0 bg-green-600 text-white py-3 px-4 z-10 flex items-center justify-center gap-2 font-bold text-lg">
                    <CheckCircle className="h-6 w-6" />
                    VOUS AVEZ RÉSERVÉ CE CADEAU
                  </div>
                )}
                {!gift.current_user_interested && gift.interested_users && gift.interested_users.length > 0 && (
                  <div className="absolute top-0 left-0 right-0 bg-orange-600 text-white py-3 px-4 z-10 flex items-center justify-center gap-2 font-bold text-lg">
                    <AlertCircle className="h-6 w-6" />
                    DÉJÀ RÉSERVÉ PAR {gift.interested_users.map((u) => u.user_name.toUpperCase()).join(', ')}
                  </div>
                )}
                {gift.image_url && (
                  <div className={`h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-4 ${
                    gift.current_user_interested || (gift.interested_users && gift.interested_users.length > 0)
                      ? 'mt-16'
                      : ''
                  }`}>
                    <img
                      src={gift.image_url}
                      alt={gift.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                <div className={`p-5 ${
                  !gift.image_url && (gift.current_user_interested || (gift.interested_users && gift.interested_users.length > 0))
                    ? 'mt-16'
                    : ''
                }`}>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {gift.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {gift.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {gift.price.toFixed(2)} €
                    </span>
                    {gift.categories && gift.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {gift.categories.slice(0, 2).map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional Info Box */}
                  {gift.interested_users && gift.interested_users.length > 0 && (
                    <div className={`mb-4 p-4 rounded-lg border-2 ${
                      gift.current_user_interested
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                        : 'bg-orange-100 dark:bg-orange-900/30 border-orange-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {gift.current_user_interested ? (
                          <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-700 dark:text-orange-400" />
                        )}
                        <p className={`font-bold text-base ${
                          gift.current_user_interested
                            ? 'text-green-900 dark:text-green-300'
                            : 'text-orange-900 dark:text-orange-300'
                        }`}>
                          {gift.current_user_interested
                            ? 'Vous avez réservé ce cadeau'
                            : 'Ce cadeau est déjà réservé'}
                        </p>
                      </div>
                      {!gift.current_user_interested && (
                        <p className="text-sm font-semibold text-orange-800 dark:text-orange-400">
                          Réservé par : {gift.interested_users.map((u) => u.user_name).join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <a
                      href={gift.purchase_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Voir le produit
                    </a>
                    <button
                      onClick={() => toggleInterest(gift.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-base font-bold rounded-lg transition-colors ${
                        gift.current_user_interested
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {gift.current_user_interested ? (
                        <>
                          <X className="h-5 w-5" />
                          Annuler ma réservation
                        </>
                      ) : (
                        <>
                          <Heart className="h-5 w-5" />
                          Réserver ce cadeau
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-4 border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-10 w-10 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attention !
              </h2>
            </div>
            
            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Ce cadeau est déjà réservé par :
              </p>
              <div className="bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 rounded-lg p-4 mb-4">
                <p className="text-xl font-bold text-orange-900 dark:text-orange-300">
                  {selectedGift.interested_users?.map((u) => u.user_name).join(', ')}
                </p>
              </div>
              <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
                <strong>Voulez-vous quand même réserver ce cadeau ?</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Si vous confirmez, vous et {selectedGift.interested_users?.map((u) => u.user_name).join(', ')} aurez tous les deux réservé ce cadeau.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedGift(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold rounded-lg transition-colors text-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => selectedGift && performToggleInterest(selectedGift.id)}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors text-lg"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
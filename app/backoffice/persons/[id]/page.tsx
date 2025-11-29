'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Person, PersonGift } from '@/lib/supabase';

type GiftFormData = {
  name: string;
  amount: string;
  status: 'Idée' | 'Commandé' | 'Livré';
  image_url: string;
  note: string;
};

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [gifts, setGifts] = useState<PersonGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [editingGift, setEditingGift] = useState<PersonGift | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState<GiftFormData>({
    name: '',
    amount: '',
    status: 'Idée',
    image_url: '',
    note: '',
  });

  useEffect(() => {
    loadPersonAndGifts();
  }, [personId]);

  const loadPersonAndGifts = async () => {
    try {
      // Load person
      const { data: personData, error: personError } = await supabase
        .from('persons')
        .select('*')
        .eq('id', personId)
        .single();

      if (personError) throw personError;
      setPerson(personData);

      // Load gifts
      const { data: giftsData, error: giftsError } = await supabase
        .from('person_gifts')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false });

      if (giftsError) throw giftsError;
      setGifts(giftsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      status: 'Idée',
      image_url: '',
      note: '',
    });
    setEditingGift(null);
    setShowGiftForm(false);
  };

  const handleEditGift = (gift: PersonGift) => {
    setFormData({
      name: gift.name,
      amount: gift.amount.toString(),
      status: gift.status,
      image_url: gift.image_url || '',
      note: gift.note || '',
    });
    setEditingGift(gift);
    setShowGiftForm(true);
  };

  const handleSubmitGift = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setSubmitting(true);
    try {
      if (editingGift) {
        // Update existing gift
        const { error } = await supabase
          .from('person_gifts')
          .update({
            name: formData.name.trim(),
            amount: amount,
            status: formData.status,
            image_url: formData.image_url.trim() || null,
            note: formData.note.trim() || null,
          })
          .eq('id', editingGift.id);

        if (error) throw error;

        // Update local state
        setGifts(
          gifts.map((g) =>
            g.id === editingGift.id
              ? {
                  ...g,
                  name: formData.name.trim(),
                  amount: amount,
                  status: formData.status,
                  image_url: formData.image_url.trim() || undefined,
                  note: formData.note.trim() || undefined,
                }
              : g
          )
        );
      } else {
        // Create new gift
        const { data, error } = await supabase
          .from('person_gifts')
          .insert({
            person_id: personId,
            name: formData.name.trim(),
            amount: amount,
            status: formData.status,
            image_url: formData.image_url.trim() || null,
            note: formData.note.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        setGifts([data, ...gifts]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving gift:', error);
      alert('Échec de l\'enregistrement du cadeau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cadeau ?')) return;

    setDeleting(id);
    try {
      const { error } = await supabase.from('person_gifts').delete().eq('id', id);

      if (error) throw error;
      setGifts(gifts.filter((g) => g.id !== id));
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Échec de la suppression du cadeau');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      Idée: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      Commandé: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      Livré: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    };
    return badges[status as keyof typeof badges] || badges.Idée;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      Idée: '💡',
      Commandé: '📦',
      Livré: '✅',
    };
    return icons[status as keyof typeof icons] || '💡';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Personne non trouvée</p>
        <Link
          href="/backoffice/persons"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retour à la liste
        </Link>
      </div>
    );
  }

  const totalSpent = gifts.reduce((sum, gift) => sum + Number(gift.amount), 0);
  const remainingBudget = Number(person.budget) - totalSpent;
  const budgetPercentage = Math.max(0, Math.min(100, (remainingBudget / person.budget) * 100));

  const giftsByStatus = {
    Idée: gifts.filter((g) => g.status === 'Idée'),
    Commandé: gifts.filter((g) => g.status === 'Commandé'),
    Livré: gifts.filter((g) => g.status === 'Livré'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/backoffice/persons"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Retour
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{person.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestion des cadeaux</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowGiftForm(!showGiftForm);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          {showGiftForm ? '✕ Annuler' : '➕ Ajouter un cadeau'}
        </button>
      </div>

      {/* Budget Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Résumé du budget
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budget total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {person.budget.toFixed(2)} €
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dépensé</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalSpent.toFixed(2)} €
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Restant</p>
            <p
              className={`text-2xl font-bold ${
                remainingBudget < 0
                  ? 'text-red-600 dark:text-red-400'
                  : remainingBudget < person.budget * 0.2
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {remainingBudget.toFixed(2)} €
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              remainingBudget < 0
                ? 'bg-red-500'
                : remainingBudget < person.budget * 0.2
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${budgetPercentage}%` }}
          ></div>
        </div>
        {remainingBudget < 0 && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            ⚠️ Budget dépassé de {Math.abs(remainingBudget).toFixed(2)} €
          </p>
        )}
      </div>

      {/* Gift Form */}
      {showGiftForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingGift ? 'Modifier le cadeau' : 'Ajouter un nouveau cadeau'}
          </h2>
          <form onSubmit={handleSubmitGift} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du cadeau *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Livre, Montre, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: 29.99"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'Idée' | 'Commandé' | 'Livré',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Idée">💡 Idée</option>
                <option value="Commandé">📦 Commandé</option>
                <option value="Livré">✅ Livré</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de l'image (optionnel)
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note (optionnel)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Détails supplémentaires..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-md"
              >
                {submitting
                  ? 'Enregistrement...'
                  : editingGift
                  ? 'Mettre à jour'
                  : 'Ajouter le cadeau'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gifts by Status */}
      {gifts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucun cadeau pour le moment
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Commencez par ajouter le premier cadeau pour {person.name}
          </p>
          <button
            onClick={() => setShowGiftForm(true)}
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Ajouter le premier cadeau
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(['Idée', 'Commandé', 'Livré'] as const).map((status) => {
            const statusGifts = giftsByStatus[status];
            if (statusGifts.length === 0) return null;

            return (
              <div key={status}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>{getStatusIcon(status)}</span>
                  <span>{status}</span>
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({statusGifts.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusGifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                    >
                      {gift.image_url && (
                        <div className="h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <img
                            src={gift.image_url}
                            alt={gift.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                            {gift.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(gift.status)}`}>
                            {getStatusIcon(gift.status)}
                          </span>
                        </div>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {Number(gift.amount).toFixed(2)} €
                        </p>
                        {gift.note && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {gift.note}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditGift(gift)}
                            className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteGift(gift.id)}
                            disabled={deleting === gift.id}
                            className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            {deleting === gift.id ? '...' : '🗑️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
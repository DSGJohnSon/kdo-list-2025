'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Person, PersonGift } from '@/lib/supabase';

type PersonWithStats = Person & {
  totalSpent: number;
  remainingBudget: number;
  giftCounts: {
    idee: number;
    commande: number;
    livre: number;
  };
};

type PersonGiftWithPerson = PersonGift & {
  person_name: string;
};

export default function PersonsPage() {
  const [persons, setPersons] = useState<PersonWithStats[]>([]);
  const [allGifts, setAllGifts] = useState<PersonGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGiftsView, setShowGiftsView] = useState(false);
  const [updatingGiftId, setUpdatingGiftId] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonBudget, setNewPersonBudget] = useState('');

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      // Load persons
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .order('created_at', { ascending: false });

      if (personsError) throw personsError;

      // Load all person gifts
      const { data: giftsData, error: giftsError } = await supabase
        .from('person_gifts')
        .select('*');

      if (giftsError) throw giftsError;

      // Store all gifts
      setAllGifts(giftsData || []);

      // Calculate stats for each person
      const personsWithStats: PersonWithStats[] = (personsData || []).map((person) => {
        const personGifts = (giftsData || []).filter(
          (gift: PersonGift) => gift.person_id === person.id
        );

        const totalSpent = personGifts.reduce(
          (sum: number, gift: PersonGift) => sum + Number(gift.amount),
          0
        );

        const giftCounts = {
          idee: personGifts.filter((g: PersonGift) => g.status === 'Idée').length,
          commande: personGifts.filter((g: PersonGift) => g.status === 'Commandé').length,
          livre: personGifts.filter((g: PersonGift) => g.status === 'Livré').length,
        };

        return {
          ...person,
          totalSpent,
          remainingBudget: Number(person.budget) - totalSpent,
          giftCounts,
        };
      });

      setPersons(personsWithStats);
    } catch (error) {
      console.error('Error loading persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim() || !newPersonBudget) return;

    const budget = parseFloat(newPersonBudget);
    if (isNaN(budget) || budget < 0) {
      alert('Veuillez entrer un budget valide');
      return;
    }

    setCreating(true);
    try {
      if (editingPerson) {
        // Update existing person
        const { error } = await supabase
          .from('persons')
          .update({
            name: newPersonName.trim(),
            budget: budget,
          })
          .eq('id', editingPerson.id);

        if (error) throw error;

        // Reload to get updated stats
        await loadPersons();
      } else {
        // Create new person
        const { data, error } = await supabase
          .from('persons')
          .insert({
            name: newPersonName.trim(),
            budget: budget,
          })
          .select()
          .single();

        if (error) throw error;

        // Add to list with initial stats
        setPersons([
          {
            ...data,
            totalSpent: 0,
            remainingBudget: budget,
            giftCounts: { idee: 0, commande: 0, livre: 0 },
          },
          ...persons,
        ]);
      }
      
      setNewPersonName('');
      setNewPersonBudget('');
      setShowForm(false);
      setEditingPerson(null);
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Échec de l\'enregistrement de la personne');
    } finally {
      setCreating(false);
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setNewPersonName(person.name);
    setNewPersonBudget(person.budget.toString());
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingPerson(null);
    setNewPersonName('');
    setNewPersonBudget('');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette personne et tous ses cadeaux ?'))
      return;

    setDeleting(id);
    try {
      const { error } = await supabase.from('persons').delete().eq('id', id);

      if (error) throw error;
      setPersons(persons.filter((person) => person.id !== id));
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Échec de la suppression de la personne');
    } finally {
      setDeleting(null);
    }
  };

  const getBudgetColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage < 0) return 'text-red-600 dark:text-red-400';
    if (percentage < 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getBudgetBarColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage < 0) return 'bg-red-500';
    if (percentage < 20) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const handleUpdateGiftStatus = async (giftId: string, newStatus: 'Idée' | 'Commandé' | 'Livré') => {
    setUpdatingGiftId(giftId);
    try {
      const { error } = await supabase
        .from('person_gifts')
        .update({ status: newStatus })
        .eq('id', giftId);

      if (error) throw error;

      // Update local state
      setAllGifts(allGifts.map(g => g.id === giftId ? { ...g, status: newStatus } : g));
      
      // Reload persons to update stats
      await loadPersons();
    } catch (error) {
      console.error('Error updating gift status:', error);
      alert('Échec de la mise à jour du statut');
    } finally {
      setUpdatingGiftId(null);
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
          <p className="text-gray-600 dark:text-gray-400">Chargement des personnes...</p>
        </div>
      </div>
    );
  }

  // Calculate global stats
  const globalStats = {
    totalPersons: persons.length,
    totalBudget: persons.reduce((sum, p) => sum + Number(p.budget), 0),
    totalSpent: persons.reduce((sum, p) => sum + p.totalSpent, 0),
    totalRemaining: persons.reduce((sum, p) => sum + p.remainingBudget, 0),
    totalGifts: persons.reduce(
      (sum, p) => sum + p.giftCounts.idee + p.giftCounts.commande + p.giftCounts.livre,
      0
    ),
    totalIdeas: persons.reduce((sum, p) => sum + p.giftCounts.idee, 0),
    totalOrdered: persons.reduce((sum, p) => sum + p.giftCounts.commande, 0),
    totalDelivered: persons.reduce((sum, p) => sum + p.giftCounts.livre, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des personnes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérer les personnes et leurs cadeaux avec budget
          </p>
        </div>
        <div className="flex gap-2">
          {persons.length > 0 && (
            <button
              onClick={() => setShowGiftsView(!showGiftsView)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              {showGiftsView ? '✕ Fermer' : '📋 Vue globale des cadeaux'}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            {showForm ? '✕ Annuler' : '➕ Ajouter une personne'}
          </button>
        </div>
      </div>

      {/* Global Statistics */}
      {persons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Budget Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Budget Total
              </h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {globalStats.totalBudget.toFixed(2)} €
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {globalStats.totalPersons} personne{globalStats.totalPersons > 1 ? 's' : ''}
            </p>
          </div>

          {/* Total Spent Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Dépensé
              </h3>
              <span className="text-2xl">💸</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {globalStats.totalSpent.toFixed(2)} €
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {((globalStats.totalSpent / globalStats.totalBudget) * 100).toFixed(1)}% du budget
            </p>
          </div>

          {/* Total Remaining Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Budget Restant
              </h3>
              <span className="text-2xl">💵</span>
            </div>
            <p
              className={`text-2xl font-bold ${
                globalStats.totalRemaining < 0
                  ? 'text-red-600 dark:text-red-400'
                  : globalStats.totalRemaining < globalStats.totalBudget * 0.2
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {globalStats.totalRemaining.toFixed(2)} €
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {((globalStats.totalRemaining / globalStats.totalBudget) * 100).toFixed(1)}% restant
            </p>
          </div>

          {/* Total Gifts Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Cadeaux
              </h3>
              <span className="text-2xl">🎁</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {globalStats.totalGifts}
            </p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-yellow-600 dark:text-yellow-400">
                💡 {globalStats.totalIdeas}
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                📦 {globalStats.totalOrdered}
              </span>
              <span className="text-green-600 dark:text-green-400">
                ✅ {globalStats.totalDelivered}
              </span>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingPerson ? 'Modifier la personne' : 'Ajouter une nouvelle personne'}
          </h2>
          <form onSubmit={handleCreateOrUpdatePerson} className="space-y-4">
            <div>
              <label
                htmlFor="personName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nom de la personne *
              </label>
              <input
                type="text"
                id="personName"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Marie, Jean, etc."
              />
            </div>
            <div>
              <label
                htmlFor="personBudget"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Budget total (€) *
              </label>
              <input
                type="number"
                id="personBudget"
                value={newPersonBudget}
                onChange={(e) => setNewPersonBudget(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Ex: 150.00"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-md"
              >
                {creating ? 'Enregistrement...' : editingPerson ? 'Mettre à jour' : 'Créer la personne'}
              </button>
              {editingPerson && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Global Gifts View Modal */}
      {showGiftsView && persons.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Vue globale des cadeaux
              </h2>
              <button
                onClick={() => setShowGiftsView(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {allGifts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎁</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Aucun cadeau enregistré pour le moment
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {(['Idée', 'Commandé', 'Livré'] as const).map((status) => {
                  const statusGifts = allGifts.filter((g) => g.status === status);
                  if (statusGifts.length === 0) return null;

                  return (
                    <div key={status}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span>{getStatusIcon(status)}</span>
                        <span>{status}</span>
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                          ({statusGifts.length})
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {statusGifts.map((gift) => {
                          const person = persons.find((p) => p.id === gift.person_id);
                          return (
                            <div
                              key={gift.id}
                              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                      {gift.name}
                                    </h4>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      • {person?.name}
                                    </span>
                                  </div>
                                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">
                                    {Number(gift.amount).toFixed(2)} €
                                  </p>
                                  {gift.note && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {gift.note}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span
                                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${getStatusBadge(
                                      gift.status
                                    )}`}
                                  >
                                    {getStatusIcon(gift.status)} {gift.status}
                                  </span>
                                  <select
                                    value={gift.status}
                                    onChange={(e) =>
                                      handleUpdateGiftStatus(
                                        gift.id,
                                        e.target.value as 'Idée' | 'Commandé' | 'Livré'
                                      )
                                    }
                                    disabled={updatingGiftId === gift.id}
                                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                  >
                                    <option value="Idée">💡 Idée</option>
                                    <option value="Commandé">📦 Commandé</option>
                                    <option value="Livré">✅ Livré</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {persons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune personne pour le moment
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Commencez par ajouter votre première personne
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Ajouter la première personne
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {persons.map((person) => {
            const budgetPercentage = Math.max(
              0,
              Math.min(100, (person.remainingBudget / person.budget) * 100)
            );

            return (
              <div
                key={person.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {person.name}
                  </h3>

                  {/* Budget Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Budget total
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {person.budget.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Dépensé</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {person.totalSpent.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Restant</span>
                      <span
                        className={`font-bold ${getBudgetColor(
                          person.remainingBudget,
                          person.budget
                        )}`}
                      >
                        {person.remainingBudget.toFixed(2)} €
                      </span>
                    </div>

                    {/* Budget Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${getBudgetBarColor(
                          person.remainingBudget,
                          person.budget
                        )}`}
                        style={{ width: `${budgetPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Gift Counts */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                      💡 {person.giftCounts.idee} idée{person.giftCounts.idee !== 1 ? 's' : ''}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                      📦 {person.giftCounts.commande} commandé
                      {person.giftCounts.commande !== 1 ? 's' : ''}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                      ✅ {person.giftCounts.livre} livré{person.giftCounts.livre !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/backoffice/persons/${person.id}`}
                      className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center"
                    >
                      Cadeaux
                    </Link>
                    <button
                      onClick={() => handleEditPerson(person)}
                      className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(person.id)}
                      disabled={deleting === person.id}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                      {deleting === person.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
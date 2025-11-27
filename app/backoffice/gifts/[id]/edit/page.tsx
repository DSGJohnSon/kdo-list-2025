'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Gift } from '@/lib/supabase';

export default function EditGiftPage() {
  const router = useRouter();
  const params = useParams();
  const giftId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [productUrl, setProductUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    purchase_link: '',
    image_url: '',
    price: '',
    categories: '',
  });

  useEffect(() => {
    loadGift();
  }, [giftId]);

  const handleScrapeProduct = async () => {
    if (!productUrl.trim()) {
      alert('Veuillez entrer une URL de produit');
      return;
    }

    const isAmazon = productUrl.includes('amazon.');
    const isFnac = productUrl.includes('fnac.com') || productUrl.includes('fnac.fr');

    if (!isAmazon && !isFnac) {
      alert('Veuillez entrer une URL Amazon ou Fnac valide');
      return;
    }

    setScraping(true);
    try {
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du scraping');
      }

      // Fill form with scraped data
      setFormData({
        title: data.title || formData.title,
        description: data.description || formData.description,
        purchase_link: productUrl,
        image_url: data.imageUrl || formData.image_url,
        price: data.price ? data.price.toString() : formData.price,
        categories: data.categories ? data.categories.join(', ') : formData.categories,
      });

      alert(`Informations récupérées avec succès depuis ${data.source} !`);
    } catch (error: any) {
      console.error('Error scraping product:', error);
      alert(error.message || 'Erreur lors de la récupération des informations');
    } finally {
      setScraping(false);
    }
  };

  const loadGift = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('id', giftId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          description: data.description,
          purchase_link: data.purchase_link,
          image_url: data.image_url || '',
          price: data.price.toString(),
          categories: data.categories?.join(', ') || '',
        });
      }
    } catch (error) {
      console.error('Error loading gift:', error);
      alert('Échec du chargement du cadeau');
      router.push('/backoffice/gifts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const categoriesArray = formData.categories
        .split(',')
        .map((cat) => cat.trim())
        .filter((cat) => cat.length > 0);

      const { error } = await supabase
        .from('gifts')
        .update({
          title: formData.title,
          description: formData.description,
          purchase_link: formData.purchase_link,
          image_url: formData.image_url || null,
          price: parseFloat(formData.price),
          categories: categoriesArray,
        })
        .eq('id', giftId);

      if (error) throw error;

      router.push('/backoffice/gifts');
      router.refresh();
    } catch (error) {
      console.error('Error updating gift:', error);
      alert('Échec de la mise à jour du cadeau');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du cadeau...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Modifier le cadeau
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Mettre à jour les détails du cadeau
        </p>
      </div>

      {/* Product Scraper Section */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg shadow-md p-6 border-2 border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🛒</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Mettre à jour depuis Amazon ou Fnac
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Collez un lien Amazon ou Fnac pour mettre à jour automatiquement les informations
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://www.amazon.fr/... ou https://www.fnac.com/..."
            className="flex-1 px-4 py-3 border border-orange-300 dark:border-orange-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={scraping}
          />
          <button
            type="button"
            onClick={handleScrapeProduct}
            disabled={scraping || !productUrl.trim()}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold rounded-lg transition-colors shadow-md whitespace-nowrap"
          >
            {scraping ? '⏳ Récupération...' : '🔍 Récupérer'}
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 border border-gray-200 dark:border-gray-700"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Titre *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Titre du cadeau"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Short description of the gift"
          />
        </div>

        <div>
          <label
            htmlFor="purchase_link"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Lien d'achat *
          </label>
          <input
            type="url"
            id="purchase_link"
            name="purchase_link"
            value={formData.purchase_link}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="https://exemple.com/produit"
          />
        </div>

        <div>
          <label
            htmlFor="image_url"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            URL de l'image (optionnel)
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="https://exemple.com/image.jpg"
          />
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Price (€) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="29.99"
          />
        </div>

        <div>
          <label
            htmlFor="categories"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Catégories (séparées par des virgules)
          </label>
          <input
            type="text"
            id="categories"
            name="categories"
            value={formData.categories}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Électronique, Jeux, Livres"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Séparez les catégories par des virgules
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
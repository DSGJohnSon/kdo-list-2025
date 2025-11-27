import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('amazon.')) {
      return NextResponse.json(
        { error: 'URL Amazon invalide' },
        { status: 400 }
      );
    }

    // Fetch the Amazon page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error('Impossible de récupérer la page Amazon');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract product information
    let title = '';
    let price = 0;
    let imageUrl = '';
    let description = '';

    // Try different selectors for title
    title = $('#productTitle').text().trim() ||
            $('h1.product-title').text().trim() ||
            $('span#productTitle').text().trim() ||
            '';

    // Try different selectors for price
    const priceText = 
      $('.a-price .a-offscreen').first().text().trim() ||
      $('#priceblock_ourprice').text().trim() ||
      $('#priceblock_dealprice').text().trim() ||
      $('.a-price-whole').first().text().trim() ||
      '';

    // Extract numeric price
    if (priceText) {
      const priceMatch = priceText.match(/[\d,]+[.,]?\d*/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(',', '.').replace(/\s/g, ''));
      }
    }

    // Try different selectors for image
    imageUrl = 
      $('#landingImage').attr('src') ||
      $('#imgBlkFront').attr('src') ||
      $('#main-image').attr('src') ||
      $('.a-dynamic-image').first().attr('src') ||
      '';

    // If image URL is a data URL or thumbnail, try to get larger version
    if (imageUrl && imageUrl.includes('_AC_')) {
      imageUrl = imageUrl.replace(/_AC_.*?_/, '_AC_SL1500_');
    }

    // Try to get description
    const featureBullets = $('#feature-bullets-btf ul li, #feature-bullets ul li')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0)
      .slice(0, 3);

    if (featureBullets.length > 0) {
      description = featureBullets.join(' • ');
    } else {
      description = $('#productDescription p').first().text().trim().slice(0, 200);
    }

    // If description is still empty, try meta description
    if (!description) {
      description = $('meta[name="description"]').attr('content')?.trim().slice(0, 200) || '';
    }

    // Extract categories from breadcrumbs
    const categories: string[] = [];
    $('#wayfinding-breadcrumbs_feature_div a, .a-breadcrumb a').each((_, el) => {
      const category = $(el).text().trim();
      if (category && category.length > 0 && category.length < 50) {
        categories.push(category);
      }
    });

    // Validate extracted data
    if (!title) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire le titre du produit' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      title: title.slice(0, 200), // Limit title length
      description: description || 'Produit Amazon',
      price: price || 0,
      imageUrl: imageUrl || '',
      categories: categories.slice(0, 5), // Limit to 5 categories
    });

  } catch (error) {
    console.error('Error scraping Amazon:', error);
    return NextResponse.json(
      { error: 'Erreur lors du scraping de la page Amazon' },
      { status: 500 }
    );
  }
}
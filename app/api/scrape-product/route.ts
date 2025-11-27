import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function scrapeAmazon(url: string, html: string) {
  const $ = cheerio.load(html);

  let title = '';
  let price = 0;
  let imageUrl = '';
  let description = '';

  // Extract title
  title = $('#productTitle').text().trim() ||
          $('h1.product-title').text().trim() ||
          $('span#productTitle').text().trim() ||
          '';

  // Extract price
  const priceText = 
    $('.a-price .a-offscreen').first().text().trim() ||
    $('#priceblock_ourprice').text().trim() ||
    $('#priceblock_dealprice').text().trim() ||
    $('.a-price-whole').first().text().trim() ||
    '';

  if (priceText) {
    const priceMatch = priceText.match(/[\d,]+[.,]?\d*/);
    if (priceMatch) {
      price = parseFloat(priceMatch[0].replace(',', '.').replace(/\s/g, ''));
    }
  }

  // Extract image
  imageUrl = 
    $('#landingImage').attr('src') ||
    $('#imgBlkFront').attr('src') ||
    $('#main-image').attr('src') ||
    $('.a-dynamic-image').first().attr('src') ||
    '';

  if (imageUrl && imageUrl.includes('_AC_')) {
    imageUrl = imageUrl.replace(/_AC_.*?_/, '_AC_SL1500_');
  }

  // Extract description
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

  if (!description) {
    description = $('meta[name="description"]').attr('content')?.trim().slice(0, 200) || '';
  }

  // Extract categories
  const categories: string[] = [];
  $('#wayfinding-breadcrumbs_feature_div a, .a-breadcrumb a').each((_, el) => {
    const category = $(el).text().trim();
    if (category && category.length > 0 && category.length < 50) {
      categories.push(category);
    }
  });

  return { title, price, imageUrl, description, categories };
}

async function scrapeFnac(url: string, html: string) {
  const $ = cheerio.load(html);

  let title = '';
  let price = 0;
  let imageUrl = '';
  let description = '';

  // Extract title - Fnac specific selectors
  title = $('h1.f-productHeader-Title').text().trim() ||
          $('.f-productHeader-Title').text().trim() ||
          $('h1[itemprop="name"]').text().trim() ||
          $('meta[property="og:title"]').attr('content')?.trim() ||
          '';

  // Extract price - Fnac specific selectors
  const priceText = 
    $('.f-priceBox-price').first().text().trim() ||
    $('[itemprop="price"]').attr('content') ||
    $('.price').first().text().trim() ||
    $('meta[property="product:price:amount"]').attr('content') ||
    '';

  if (priceText) {
    const priceMatch = priceText.match(/[\d,]+[.,]?\d*/);
    if (priceMatch) {
      price = parseFloat(priceMatch[0].replace(',', '.').replace(/\s/g, ''));
    }
  }

  // Extract image - Fnac specific selectors
  imageUrl = 
    $('.f-productVisuals-mainImage img').attr('src') ||
    $('[itemprop="image"]').attr('src') ||
    $('.js-ProductVisuals-image').attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    '';

  // Clean up Fnac image URL to get larger version
  if (imageUrl && imageUrl.includes('_')) {
    imageUrl = imageUrl.replace(/_\d+x\d+/, '_2000x2000');
  }

  // Extract description - Fnac specific selectors
  const descriptionParts: string[] = [];
  
  // Try to get product features
  $('.f-productDescription-list li, .ProductDescription-list li').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 0) {
      descriptionParts.push(text);
    }
  });

  if (descriptionParts.length > 0) {
    description = descriptionParts.slice(0, 3).join(' • ');
  } else {
    // Fallback to meta description
    description = 
      $('.f-productDescription-text').first().text().trim().slice(0, 200) ||
      $('[itemprop="description"]').text().trim().slice(0, 200) ||
      $('meta[name="description"]').attr('content')?.trim().slice(0, 200) ||
      '';
  }

  // Extract categories - Fnac specific selectors
  const categories: string[] = [];
  $('.f-breadcrumb-link, .breadcrumb a').each((_, el) => {
    const category = $(el).text().trim();
    if (category && category.length > 0 && category.length < 50 && category !== 'Accueil') {
      categories.push(category);
    }
  });

  return { title, price, imageUrl, description, categories };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL manquante' },
        { status: 400 }
      );
    }

    // Detect the website
    const isAmazon = url.includes('amazon.');
    const isFnac = url.includes('fnac.com') || url.includes('fnac.fr');

    if (!isAmazon && !isFnac) {
      return NextResponse.json(
        { error: 'URL non supportée. Seuls Amazon et Fnac sont supportés.' },
        { status: 400 }
      );
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error('Impossible de récupérer la page');
    }

    const html = await response.text();

    // Scrape based on the website
    let result;
    if (isAmazon) {
      result = await scrapeAmazon(url, html);
    } else {
      result = await scrapeFnac(url, html);
    }

    // Validate extracted data
    if (!result.title) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire le titre du produit' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      title: result.title.slice(0, 200),
      description: result.description || 'Produit',
      price: result.price || 0,
      imageUrl: result.imageUrl || '',
      categories: result.categories.slice(0, 5),
      source: isAmazon ? 'Amazon' : 'Fnac',
    });

  } catch (error) {
    console.error('Error scraping product:', error);
    return NextResponse.json(
      { error: 'Erreur lors du scraping de la page' },
      { status: 500 }
    );
  }
}
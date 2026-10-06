const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DATA_FILE = path.join(__dirname, '../../data/crawled_pages.json');

/**
 * Service Web Crawler & Content Scraper
 * Mengambil teks bersih dari halaman website dan mengekstrak pengetahuan untuk diinjeksikan ke RAG Engine.
 */
class CrawlerService {
  constructor() {
    this.ensureFileExists();
  }

  ensureFileExists() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }

  getAllPages() {
    try {
      this.ensureFileExists();
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('[CrawlerService] Gagal membaca data crawled_pages.json:', err.message);
      return [];
    }
  }

  savePages(pages) {
    try {
      this.ensureFileExists();
      fs.writeFileSync(DATA_FILE, JSON.stringify(pages, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[CrawlerService] Gagal menyimpan crawled_pages.json:', err.message);
      return false;
    }
  }

  /**
   * Decode common HTML entities
   */
  decodeHtmlEntities(text = '') {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®')
      .replace(/&trade;/g, '™')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  /**
   * Ekstraksi teks dari HTML mentah tanpa dependensi eksternal
   */
  extractContentFromHtml(html, pageUrl) {
    if (!html) return { title: '', description: '', text: '', chunks: [], links: [] };

    // 1. Ekstrak Title
    let title = '';
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      title = this.decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim();
    }
    if (!title) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
      if (ogTitleMatch) title = this.decodeHtmlEntities(ogTitleMatch[1]).trim();
    }
    if (!title) {
      title = pageUrl;
    }

    // 2. Ekstrak Meta Description
    let description = '';
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    if (descMatch) {
      description = this.decodeHtmlEntities(descMatch[1]).replace(/\s+/g, ' ').trim();
    }

    // 3. Ekstrak internal links untuk crawling bertahap
    const links = [];
    try {
      const parsedUrl = new URL(pageUrl);
      const host = parsedUrl.hostname;
      const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
      for (const m of linkMatches) {
        let href = m[1].trim();
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          continue;
        }
        try {
          const resolved = new URL(href, pageUrl);
          if (resolved.hostname === host && resolved.protocol.startsWith('http')) {
            const cleanHref = resolved.origin + resolved.pathname;
            if (!links.includes(cleanHref) && cleanHref !== pageUrl) {
              links.push(cleanHref);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // 4. Bersihkan tag yang tidak relevan (script, style, noscript, svg, nav, footer, header, form, iframe)
    let cleanedHtml = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '');

    // 5. Ubah elemen struktural menjadi teks berformat
    cleanedHtml = cleanedHtml
      .replace(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/gi, '\n\n## $1\n')
      .replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, '\n\n### $1\n')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
      .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, '\n$1')
      .replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, ' | $1 ')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n');

    // 6. Buang seluruh tag HTML yang tersisa
    let text = cleanedHtml.replace(/<[^>]+>/g, ' ');

    // 7. Decode HTML entities
    text = this.decodeHtmlEntities(text);

    // 8. Normalisasi baris baru dan spasi berlebih
    text = text
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .filter(line => line.length > 0)
      .join('\n');

    // Buang baris duplikat berulang (seperti menu navigasi yang lolos)
    const lines = text.split('\n');
    const filteredLines = [];
    const seenRecent = new Set();
    for (const l of lines) {
      if (l.length < 4) continue;
      if (seenRecent.has(l) && l.length < 35) continue;
      seenRecent.add(l);
      filteredLines.push(l);
    }
    const cleanText = filteredLines.join('\n\n');

    // 9. Potong menjadi chunks semantik
    const chunks = [];
    const paragraphs = cleanText.split('\n\n');
    let currentChunk = '';
    let currentHeading = title;

    for (const p of paragraphs) {
      if (p.startsWith('## ') || p.startsWith('### ')) {
        if (currentChunk.trim().length >= 100) {
          chunks.push({
            heading: currentHeading,
            content: currentChunk.trim()
          });
          currentChunk = '';
        }
        currentHeading = p.replace(/^#+\s*/, '');
      } else {
        currentChunk += (currentChunk ? '\n' : '') + p;
        if (currentChunk.length >= 700) {
          chunks.push({
            heading: currentHeading,
            content: currentChunk.trim()
          });
          currentChunk = '';
        }
      }
    }

    if (currentChunk.trim().length >= 50) {
      chunks.push({
        heading: currentHeading,
        content: currentChunk.trim()
      });
    }

    // Jika chunks kosong tapi ada teks
    if (chunks.length === 0 && cleanText.length > 0) {
      chunks.push({
        heading: title,
        content: cleanText.substring(0, 1500)
      });
    }

    return {
      title,
      description,
      text: cleanText,
      chunks,
      links: links.slice(0, 8)
    };
  }

  /**
   * Crawl satu URL web
   */
  async fetchAndScrape(targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Protokol URL tidak didukung (harus http:// atau https://)');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SultanCarpetBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP Error status ${res.status} (${res.statusText})`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
        throw new Error(`Tipe konten bukan HTML (${contentType})`);
      }

      const html = await res.text();
      const extracted = this.extractContentFromHtml(html, targetUrl);

      return {
        success: true,
        url: targetUrl,
        title: extracted.title,
        description: extracted.description,
        wordCount: extracted.text.split(/\s+/).filter(Boolean).length,
        chunks: extracted.chunks,
        rawText: extracted.text.substring(0, 8000), // Batas wajar teks
        links: extracted.links
      };
    } catch (err) {
      return {
        success: false,
        url: targetUrl,
        error: err.name === 'AbortError' ? 'Koneksi timeout setelah 12 detik' : err.message
      };
    }
  }

  /**
   * Jalankan proses Crawling & Scraping (Single URL atau bersama sub-link)
   */
  async crawl(startUrl, options = { maxPages: 1, followLinks: false }) {
    const maxPages = Math.min(Math.max(Number(options.maxPages || 1), 1), 5);
    const followLinks = Boolean(options.followLinks);

    const queue = [startUrl];
    const visited = new Set();
    const results = [];
    const allPages = this.getAllPages();

    while (queue.length > 0 && visited.size < maxPages) {
      const currentUrl = queue.shift();
      if (!currentUrl || visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      const scrapeResult = await this.fetchAndScrape(currentUrl);

      if (scrapeResult.success) {
        const id = `crawl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const pageRecord = {
          id,
          url: currentUrl,
          title: scrapeResult.title,
          description: scrapeResult.description,
          wordCount: scrapeResult.wordCount,
          chunkCount: scrapeResult.chunks.length,
          chunks: scrapeResult.chunks,
          crawledAt: new Date().toISOString(),
          status: 'success'
        };

        // Hapus entri lama dengan URL sama jika ada
        const existingIdx = allPages.findIndex(p => p.url === currentUrl);
        if (existingIdx !== -1) {
          allPages[existingIdx] = pageRecord;
        } else {
          allPages.unshift(pageRecord);
        }

        results.push(pageRecord);

        // Tambah link baru ke antrean bila followLinks aktif
        if (followLinks && scrapeResult.links && scrapeResult.links.length > 0) {
          for (const nextLink of scrapeResult.links) {
            if (!visited.has(nextLink) && !queue.includes(nextLink) && (queue.length + visited.size) < maxPages) {
              queue.push(nextLink);
            }
          }
        }
      } else {
        results.push({
          url: currentUrl,
          status: 'error',
          error: scrapeResult.error
        });
      }
    }

    this.savePages(allPages);

    // Otomatis sinkronisasi ke RAG Engine
    try {
      const ragService = require('./ragService');
      ragService.buildIndex();
    } catch (e) {}

    return {
      success: results.some(r => r.status === 'success'),
      totalCrawled: results.filter(r => r.status === 'success').length,
      results,
      allPagesCount: allPages.length
    };
  }

  /**
   * Hapus halaman hasil crawl berdasarkan ID
   */
  deletePage(id) {
    const pages = this.getAllPages();
    const filtered = pages.filter(p => p.id !== id);
    if (pages.length === filtered.length) return false;

    this.savePages(filtered);

    // Sinkronkan ke RAG
    try {
      const ragService = require('./ragService');
      ragService.buildIndex();
    } catch (e) {}

    return true;
  }

  /**
   * Hapus seluruh data crawl
   */
  clearAll() {
    this.savePages([]);
    try {
      const ragService = require('./ragService');
      ragService.buildIndex();
    } catch (e) {}
    return true;
  }
}

module.exports = new CrawlerService();

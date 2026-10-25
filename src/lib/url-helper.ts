/**
 * Normalizes legacy image paths (including immich_proxy.php, gdrive_proxy.php, and relative uploads/)
 * into clean Next.js paths.
 */
export function normalizeImageUrl(
  rawPath: string | null | undefined,
  preferredSize?: 'thumbnail' | 'preview' | 'large'
): string {
  if (!rawPath) return '';
  let path = rawPath.trim();
  if (!path) return '';

  // Handle immich_proxy.php
  if (path.includes('immich_proxy.php')) {
    const qIndex = path.indexOf('?');
    const query = qIndex !== -1 ? path.slice(qIndex + 1) : '';
    const params = new URLSearchParams(query);
    if (preferredSize && !params.has('size')) {
      params.set('size', preferredSize);
    }
    return `/api/proxy/immich?${params.toString()}`;
  }

  // Handle direct Immich API URLs
  if (path.includes('/api/assets/')) {
    if (preferredSize === 'thumbnail' || preferredSize === 'preview') {
      const immichSize = preferredSize === 'thumbnail' ? 'thumbnail' : 'preview';
      if (path.includes('/original')) {
        const [pathPart, queryPart] = path.split('?');
        const newPath = pathPart.replace(/\/original$/, '/thumbnail');
        const params = new URLSearchParams(queryPart || '');
        params.set('size', immichSize);
        return `${newPath}?${params.toString()}`;
      }
      if (path.includes('/thumbnail')) {
        const [pathPart, queryPart] = path.split('?');
        const params = new URLSearchParams(queryPart || '');
        params.set('size', immichSize);
        return `${pathPart}?${params.toString()}`;
      }
    }
    return path;
  }

  // Handle gdrive_proxy.php
  if (path.includes('gdrive_proxy.php')) {
    const qIndex = path.indexOf('?');
    const query = qIndex !== -1 ? path.slice(qIndex + 1) : '';
    const params = new URLSearchParams(query);
    if (preferredSize && !params.has('size')) {
      params.set('size', preferredSize);
    }
    return `/api/proxy/gdrive?${params.toString()}`;
  }

  // Handle direct googleusercontent URLs
  if (path.includes('googleusercontent.com')) {
    const target =
      preferredSize === 'thumbnail'
        ? '=w400'
        : preferredSize === 'preview'
        ? '=w1440'
        : '=w1920';
    if (/=[ws]\d+/i.test(path)) {
      return path.replace(/=[ws]\d+/i, target);
    }
    return `${path}${target}`;
  }

  // External URLs or data URIs
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('/api/')
  ) {
    return path;
  }

  // Local path
  if (path.startsWith('/uploads/')) return path;
  if (path.startsWith('uploads/')) return `/${path}`;

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const uploadPrefixes = [
    'ita/',
    'news/',
    'sliders/',
    'personnel/',
    'curriculum/',
    'downloads/',
    'galleries/',
    'settings/',
    'media/',
  ];
  if (uploadPrefixes.some((p) => cleanPath.startsWith(p))) {
    return `/uploads/${cleanPath}`;
  }

  if (
    cleanPath.startsWith('assets/') ||
    cleanPath.startsWith('images/') ||
    cleanPath.startsWith('icons/') ||
    cleanPath.startsWith('logo') ||
    cleanPath.startsWith('favicon')
  ) {
    return `/${cleanPath}`;
  }

  if (
    cleanPath.startsWith('ita_') ||
    cleanPath.startsWith('file_') ||
    cleanPath.startsWith('fb_cover_') ||
    !cleanPath.includes('/')
  ) {
    return `/uploads/${cleanPath}`;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Converts legacy .php links stored in database (navbars, sliders, blocks, etc.)
 * into clean Next.js routes.
 */
export function normalizeLinkUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '#';
  const url = rawUrl.trim();
  if (!url || url === '#') return '#';

  // External URLs, mailto, tel
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
  ) {
    return url;
  }

  // Strip leading ./ or /
  const clean = url.replace(/^\.?\//, '');
  const [filePart, queryPart] = clean.split('?');
  const params = new URLSearchParams(queryPart || '');

  switch (filePart) {
    case 'index.php':
      return '/';
    case 'news.php': {
      const slug = params.get('slug') || params.get('id');
      if (slug) return `/news/${encodeURIComponent(slug)}`;
      const cat = params.get('category');
      if (cat) return `/news?category=${encodeURIComponent(cat)}`;
      return '/news';
    }
    case 'about.php': {
      const slug = params.get('slug');
      if (slug) return `/${encodeURIComponent(slug)}`;
      return '/about';
    }
    case 'curriculum.php':
      return queryPart ? `/curriculum?${queryPart}` : '/curriculum';
    case 'personnel.php':
      return queryPart ? `/personnel?${queryPart}` : '/personnel';
    case 'personnel_dept.php': {
      const id = params.get('id');
      return id ? `/personnel/dept/${encodeURIComponent(id)}` : '/personnel';
    }
    case 'personnel_sub_dept.php': {
      const id = params.get('id');
      return id ? `/personnel/sub-dept/${encodeURIComponent(id)}` : '/personnel';
    }
    case 'personnel_detail.php': {
      const id = params.get('id');
      return id ? `/personnel/${encodeURIComponent(id)}` : '/personnel';
    }
    case 'executives.php':
      return '/executives';
    case 'gallery.php': {
      const album = params.get('album') || params.get('id');
      return album ? `/gallery?album=${encodeURIComponent(album)}` : '/gallery';
    }
    case 'download.php':
      return queryPart ? `/downloads?${queryPart}` : '/downloads';
    case 'ita.php':
      return queryPart ? `/ita?${queryPart}` : '/ita';
    case 'complaint.php':
      return queryPart ? `/complaints?${queryPart}` : '/complaints';
    case 'sitemap.php':
      return '/sitemap';
    case 'login.php':
      return '/login';
    case 'admin/index.php':
      return '/admin';
    default:
      return url.startsWith('/') ? url : `/${url}`;
  }
}

const COMMON_LUCIDE_SVGS: Record<string, string> = {
  'file-text':
    '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'external-link':
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  'book-open':
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  briefcase:
    '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  'graduation-cap':
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  images:
    '<path d="M18 22H4a2 2 0 0 1-2-2V6"/><rect width="18" height="18" x="6" y="2" rx="2"/><circle cx="12" cy="8" r="2"/><path d="m24 16-5.5-5.5a2.12 2.12 0 0 0-3 0L6 20"/>',
  clock:
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'check-circle-2':
    '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>',
  'user-check':
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.94"/>',
};

/**
 * Rewrites legacy image proxies, .php links, and renders data-lucide icons inside raw HTML content
 */
export function normalizeHtmlContent(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/(?:\/)?immich_proxy\.php\?([^"'\s>]+)/g, '/api/proxy/immich?$1')
    .replace(/(?:\/)?gdrive_proxy\.php\?([^"'\s>]+)/g, '/api/proxy/gdrive?$1')
    .replace(/src=["'](?!https?:\/\/|\/|data:)(uploads\/[^"']+)["']/g, 'src="/$1"')
    .replace(/src=["'](?!https?:\/\/|\/|data:)(assets\/[^"']+)["']/g, 'src="/$1"')
    .replace(/href=["'](?!https?:\/\/|\/|#|mailto:|tel:)(uploads\/[^"']+)["']/g, 'href="/$1"')
    .replace(/href=["']([^"']+\.php(?:\?[^"']*)?)["']/g, (_match, p1) => {
      return `href="${normalizeLinkUrl(p1)}"`;
    })
    .replace(/\bbg-indigo-(?:600|650)\b/g, 'bg-orange-600')
    .replace(/\btext-indigo-(?:600|650)\b/g, 'text-orange-600')
    .replace(/\bborder-indigo-(?:600|650)\b/g, 'border-orange-600')
    .replace(/\bhover:bg-indigo-(?:650|700)\b/g, 'hover:bg-orange-700')
    .replace(/\bhover:text-indigo-(?:650|700)\b/g, 'hover:text-orange-700')
    .replace(/<i\b[^>]*\bdata-lucide=["']([^"']+)["'][^>]*><\/i>/gi, (match) => {
      const nameMatch = match.match(/data-lucide=["']([^"']+)["']/i);
      const classMatch = match.match(/class(?:Name)?=["']([^"']+)["']/i);
      const iconName = nameMatch ? nameMatch[1].toLowerCase() : '';
      const className = classMatch ? classMatch[1] : '';

      const svgPaths = COMMON_LUCIDE_SVGS[iconName];
      if (svgPaths) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${iconName} ${className}" aria-hidden="true">${svgPaths}</svg>`;
      }
      return match;
    });
}

/**
 * Format hero slide image URL with optimized preview/thumbnail size
 */
export function formatSlideImageUrl(rawPath: string): string {
  if (!rawPath) return '';
  let slidePath = rawPath;
  if (slidePath.includes('/original?')) {
    slidePath = slidePath.replace('/original?', '/thumbnail?');
    if (!slidePath.includes('size=')) {
      slidePath += '&size=preview';
    } else {
      slidePath = slidePath.replace('size=thumbnail', 'size=preview');
    }
  }
  return normalizeImageUrl(slidePath, 'preview');
}

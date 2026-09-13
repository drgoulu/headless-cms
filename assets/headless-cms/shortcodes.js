/**
 * Hugo Shortcodes Extension for Sveltia CMS and Decap CMS
 * Automatically registered via CMS.registerEditorComponent()
 */
(function () {
  'use strict';

  function parseHugoArgs(rawArgs) {
    var result = { _raw: rawArgs || '' };
    if (!rawArgs) return result;
    var regex = /(?:([a-zA-Z0-9_-]+)=)?(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;
    var match;
    var posIndex = 0;
    while ((match = regex.exec(rawArgs)) !== null) {
      var key = match[1];
      var val = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4];
      if (key) {
        result[key] = val;
      } else {
        result['_pos_' + posIndex] = val;
        if (posIndex === 0) {
          result._primary = val;
        }
        posIndex++;
      }
    }
    return result;
  }

  function formatHugoArgs(obj, excludeKeys) {
    excludeKeys = excludeKeys || [];
    var parts = [];
    var posIndex = 0;
    while (obj['_pos_' + posIndex] !== undefined) {
      var pVal = String(obj['_pos_' + posIndex]);
      parts.push(pVal.includes(' ') ? '"' + pVal + '"' : pVal);
      posIndex++;
    }
    Object.keys(obj).forEach(function (key) {
      if (key.startsWith('_') || excludeKeys.includes(key)) return;
      var val = obj[key];
      if (val !== undefined && val !== null && val !== '') {
        parts.push(key + '="' + val + '"');
      }
    });
    return parts.join(' ');
  }

  function resolveHugoImagePath(src) {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//') || src.startsWith('data:')) {
      return src;
    }
    if (src.startsWith('/')) {
      return src;
    }
    var clean = src.replace(/^\.\//, '');
    var hash = window.location.hash || '';
    var match = hash.match(/\/entries\/(.+)$/);
    if (match) {
      var entryPath = match[1].split('?')[0];
      var yearMatch = entryPath.match(/^(\d{4})\//) || entryPath.match(/(?:^|\/)(\d{4})-\d{2}-\d{2}/);
      if (yearMatch) {
        return '/posts/' + yearMatch[1] + '/' + clean;
      }
      var segments = entryPath.split('/');
      if (segments.length > 1) {
        segments.pop();
        return '/posts/' + segments.join('/') + '/' + clean;
      }
    }
    return '/posts/' + clean;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function registerComponents(cms) {
    if (!cms || typeof cms.registerEditorComponent !== 'function') return;

    // 1. Figure shortcode
    cms.registerEditorComponent({
      id: 'hugo-figure',
      label: 'Figure (Hugo)',
      pattern: /{{[<%]\s*figure\s+([^>%]+?)\s*[>%]}}/,
      fromBlock: function (match) {
        return parseHugoArgs(match[1]);
      },
      toBlock: function (obj) {
        var args = formatHugoArgs(obj);
        return '{{< figure ' + args + ' >}}';
      },
      toPreview: function (obj) {
        var rawSrc = obj.src || obj._primary || '';
        var resolvedSrc = resolveHugoImagePath(rawSrc);
        var alt = obj.alt || obj.caption || '';
        var caption = obj.caption || '';
        var link = obj.link || obj.href || '';
        var align = obj.align || obj.class || 'alignright';
        var width = obj.width || '';
        var widthStyle = '';
        if (width) {
          var widthVal = width.endsWith('px') || width.endsWith('%') ? width : width + 'px';
          widthStyle = 'max-width: ' + widthVal + '; width: 100%;';
        }
        var imgHtml = '<img src="' + escapeHtml(resolvedSrc) + '" alt="' + escapeHtml(alt) + '" style="max-width:100%;height:auto;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:block;" />';
        if (link) {
          imgHtml = '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener">' + imgHtml + '</a>';
        }
        var captionHtml = caption ? '<figcaption style="font-size:0.85em;color:#64748b;margin-top:6px;text-align:center;">' + escapeHtml(caption) + '</figcaption>' : '';
        return '<figure class="' + escapeHtml(align) + '" style="' + widthStyle + 'margin:1.2em auto;display:table;">' + imgHtml + captionHtml + '</figure>';
      },
      fields: [
        { label: 'Image (src)', name: 'src', widget: 'image' },
        { label: 'Titre alternatif (alt)', name: 'alt', widget: 'string', required: false },
        { label: 'Légende (caption)', name: 'caption', widget: 'string', required: false },
        { label: 'Lien (link)', name: 'link', widget: 'string', required: false },
        { label: 'Largeur (width)', name: 'width', widget: 'string', required: false },
        {
          label: 'Alignement',
          name: 'align',
          widget: 'select',
          options: [
            { label: 'Droite (alignright)', value: 'alignright' },
            { label: 'Gauche (alignleft)', value: 'alignleft' },
            { label: 'Centre (aligncenter)', value: 'aligncenter' }
          ],
          default: 'alignright',
          required: false
        }
      ]
    });

    // 2. YouTube shortcode
    cms.registerEditorComponent({
      id: 'hugo-youtube',
      label: 'YouTube (Hugo)',
      pattern: /{{[<%]\s*youtube\s+([^>%]+?)\s*[>%]}}/,
      fromBlock: function (match) {
        return parseHugoArgs(match[1]);
      },
      toBlock: function (obj) {
        var id = obj.id || obj._primary || '';
        var extra = formatHugoArgs(obj, ['id', '_pos_0', '_primary']);
        return '{{< youtube ' + (id ? (id.includes(' ') ? '"' + id + '"' : id) : '') + (extra ? ' ' + extra : '') + ' >}}';
      },
      toPreview: function (obj) {
        var id = obj.id || obj._primary || '';
        var width = obj.width || obj.w || '';
        var widthStyle = width ? (width.endsWith('px') || width.endsWith('%') ? width : width + 'px') : '760px';
        return '<div style="max-width:' + widthStyle + ';width:100%;margin:1.5em auto;">' +
          '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;background:#000;">' +
          '<iframe src="https://www.youtube-nocookie.com/embed/' + escapeHtml(id) + '" title="YouTube" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
          '</div></div>';
      },
      fields: [
        { label: 'ID de la vidéo', name: 'id', widget: 'string' },
        { label: 'Largeur max (width)', name: 'width', widget: 'string', required: false }
      ]
    });

    // 3. Vimeo shortcode
    cms.registerEditorComponent({
      id: 'hugo-vimeo',
      label: 'Vimeo (Hugo)',
      pattern: /{{[<%]\s*vimeo\s+([^>%]+?)\s*[>%]}}/,
      fromBlock: function (match) {
        return parseHugoArgs(match[1]);
      },
      toBlock: function (obj) {
        var id = obj.id || obj._primary || '';
        return '{{< vimeo ' + id + ' >}}';
      },
      toPreview: function (obj) {
        var id = obj.id || obj._primary || '';
        return '<div style="max-width:760px;width:100%;margin:1.5em auto;">' +
          '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;">' +
          '<iframe src="https://player.vimeo.com/video/' + escapeHtml(id) + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>' +
          '</div></div>';
      },
      fields: [{ label: 'ID Vimeo', name: 'id', widget: 'string' }]
    });

    // 4. OpenBook shortcode (module openbook4hugo)
    cms.registerEditorComponent({
      id: 'hugo-openbook',
      label: 'OpenBook (Hugo)',
      pattern: /{{[<%]\s*openbook\s+([^>%]+?)\s*[>%]}}/,
      fromBlock: function (match) {
        var parsed = parseHugoArgs(match[1]);
        parsed.isbn = parsed.isbn || parsed.booknumber || parsed.id || parsed._primary || '';
        parsed.template = parsed.template || parsed.templatenumber || parsed._pos_1 || '';
        return parsed;
      },
      toBlock: function (obj) {
        if (obj.booknumber || obj.templatenumber) {
          return '{{< openbook ' + formatHugoArgs(obj, ['isbn', 'template', 'id']) + ' >}}';
        }
        var isbn = obj.isbn || obj.id || obj._primary || '';
        var template = obj.template || obj._pos_1 || '';
        var extra = template ? ' ' + template : '';
        if (isbn) {
          return '{{< openbook ' + (isbn.includes(' ') ? '"' + isbn + '"' : isbn) + extra + ' >}}';
        }
        var formatted = formatHugoArgs(obj);
        return '{{< openbook' + (formatted ? ' ' + formatted : '') + ' >}}';
      },
      toPreview: function (obj) {
        var id = obj.isbn || obj.id || obj._primary || '';
        return '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:1.2em 0;display:flex;gap:12px;align-items:center;background:#f8fafc;">' +
          '<span style="font-size:26px;">📖</span>' +
          '<div><div style="font-weight:600;color:#0f172a;">Livre OpenBook : <a href="https://openlibrary.org/search?q=' + encodeURIComponent(id) + '" target="_blank" rel="noopener" style="color:#2563eb;">' + escapeHtml(id) + '</a></div>' +
          '<div style="font-size:0.85em;color:#64748b;">Notice bibliographique Open Library</div></div>' +
          '</div>';
      },
      fields: [
        { label: 'ISBN ou Titre', name: 'isbn', widget: 'string' },
        { label: 'Modèle (template)', name: 'template', widget: 'string', required: false }
      ]
    });

    // 5. Altmetric shortcode (module altmetric4hugo)
    cms.registerEditorComponent({
      id: 'hugo-altmetric',
      label: 'Altmetric (Hugo)',
      pattern: /{{[<%]\s*altmetric\s+([^>%]+?)\s*[>%]}}/,
      fromBlock: function (match) {
        return parseHugoArgs(match[1]);
      },
      toBlock: function (obj) {
        var args = formatHugoArgs(obj);
        return '{{< altmetric ' + args + ' >}}';
      },
      toPreview: function (obj) {
        var id = obj.doi || obj.arxiv || obj.pmid || obj.id || obj._primary || '';
        return '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;margin:1em 0;display:inline-flex;gap:8px;align-items:center;background:#f8fafc;">' +
          '<span style="font-size:20px;">📊</span>' +
          '<span style="font-size:0.9em;color:#334155;"><strong>Altmetric</strong> : ' + escapeHtml(id) + '</span>' +
          '</div>';
      },
      fields: [
        { label: 'DOI', name: 'doi', widget: 'string', required: false },
        { label: 'arXiv ID', name: 'arxiv', widget: 'string', required: false },
        { label: 'PMID', name: 'pmid', widget: 'string', required: false }
      ]
    });

    // 6. Gist shortcode
    cms.registerEditorComponent({
      id: 'hugo-gist',
      label: 'GitHub Gist (Hugo)',
      pattern: /{{[<%]\s*gist\s+([^>%]+?)\s*[>%]}}/,
      fromBlock: function (match) {
        return parseHugoArgs(match[1]);
      },
      toBlock: function (obj) {
        var user = obj.user || obj._pos_0 || '';
        var id = obj.id || obj._pos_1 || '';
        var file = obj.file || obj._pos_2 || '';
        return '{{< gist ' + user + ' ' + id + (file ? ' ' + file : '') + ' >}}';
      },
      toPreview: function (obj) {
        var user = obj.user || obj._pos_0 || '';
        var id = obj.id || obj._pos_1 || '';
        return '<div style="border:1px solid #cbd5e1;border-radius:6px;padding:12px;margin:1.2em 0;background:#f8fafc;">' +
          '🐙 <strong>GitHub Gist</strong>: <a href="https://gist.github.com/' + escapeHtml(user) + '/' + escapeHtml(id) + '" target="_blank" rel="noopener" style="color:#2563eb;">' + escapeHtml(user) + '/' + escapeHtml(id) + '</a>' +
          '</div>';
      },
      fields: [
        { label: 'Utilisateur GitHub', name: 'user', widget: 'string' },
        { label: 'ID du Gist', name: 'id', widget: 'string' },
        { label: 'Fichier spécifique', name: 'file', widget: 'string', required: false }
      ]
    });

    // 7. Highlight shortcode (Paired)
    cms.registerEditorComponent({
      id: 'hugo-highlight',
      label: 'Highlight (Hugo)',
      pattern: /{{[<%]\s*highlight\s+([a-zA-Z0-9_-]+)(?:\s+([^>%]*?))?\s*[>%]}}([\s\S]*?){{[<%]\s*\/highlight\s*[>%]}}/,
      fromBlock: function (match) {
        return {
          lang: match[1],
          options: match[2] || '',
          body: match[3] || ''
        };
      },
      toBlock: function (obj) {
        var opt = obj.options ? ' ' + obj.options : '';
        return '{{< highlight ' + obj.lang + opt + ' >}}\n' + (obj.body || '') + '\n{{< /highlight >}}';
      },
      toPreview: function (obj) {
        return '<pre style="background:#1e293b;color:#f8fafc;padding:12px;border-radius:6px;overflow-x:auto;"><code>' + escapeHtml(obj.body) + '</code></pre>';
      },
      fields: [
        { label: 'Langage', name: 'lang', widget: 'string' },
        { label: 'Options', name: 'options', widget: 'string', required: false },
        { label: 'Code', name: 'body', widget: 'text' }
      ]
    });

    // 8. Universal Catch-All Fallback for any other Hugo shortcode (including custom or third-party modules)
    cms.registerEditorComponent({
      id: 'hugo-generic',
      label: 'Shortcode Hugo (Générique)',
      pattern: /{{[<%]\s*([a-zA-Z0-9_-]+)\s*([^>%]*?)\s*[>%]}}(?:([\s\S]*?){{[<%]\s*\/\1\s*[>%]}})?/,
      fromBlock: function (match) {
        return {
          name: match[1],
          args: match[2] || '',
          body: match[3] || ''
        };
      },
      toBlock: function (obj) {
        var name = obj.name || '';
        var args = obj.args ? ' ' + obj.args.trim() : '';
        if (obj.body !== undefined && obj.body !== '') {
          return '{{< ' + name + args + ' >}}\n' + obj.body + '\n{{< /' + name + ' >}}';
        }
        return '{{< ' + name + args + ' >}}';
      },
      toPreview: function (obj) {
        var name = obj.name || '';
        var args = obj.args || '';
        var body = obj.body || '';
        return '<div style="border:1px dashed #94a3b8;border-radius:6px;padding:10px 14px;margin:1em 0;background:#f8fafc;font-size:0.9em;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="color:#64748b;">⚡ Shortcode Hugo :</span>' +
          '<code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;font-weight:bold;color:#0f172a;">' + escapeHtml(name) + '</code>' +
          (args ? '<span style="color:#475569;font-family:monospace;font-size:0.85em;">' + escapeHtml(args) + '</span>' : '') +
          '</div>' +
          (body ? '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #cbd5e1;">' + escapeHtml(body) + '</div>' : '') +
          '</div>';
      },
      fields: [
        { label: 'Nom du shortcode', name: 'name', widget: 'string' },
        { label: 'Arguments', name: 'args', widget: 'string', required: false },
        { label: 'Corps (si bloc fermé)', name: 'body', widget: 'text', required: false }
      ]
    });
  }

  function init() {
    if (window.CMS && typeof window.CMS.registerEditorComponent === 'function') {
      registerComponents(window.CMS);
    } else {
      var count = 0;
      var timer = setInterval(function () {
        count++;
        if (window.CMS && typeof window.CMS.registerEditorComponent === 'function') {
          clearInterval(timer);
          registerComponents(window.CMS);
        } else if (count > 200) {
          clearInterval(timer);
        }
      }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

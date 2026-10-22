/* TRIPO 3D Studio - Exact Studio Interface & Full Functionality */
(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const icons = {
    tripoLogo: '<svg class="tripo-logo-svg" viewBox="0 0 100 100" fill="none"><polygon points="50,10 90,85 10,85" fill="#facc15"/><polygon points="50,28 76,77 24,77" fill="#141414"/><circle cx="50" cy="56" r="10" fill="#facc15"/></svg>',
    cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5v9l-9 5-9-5V8Zm0 10 9-5M3 8l9 5v9"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4 18 6-6 4 4 3-3 4 5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/></svg>',
    segment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    retopo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>',
    uv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
    texture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 15 11-12 3 3-12 11M8 15c-5-2-3 5-6 6 7 1 10-1 8-4Z"/></svg>',
    rig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="m9 20 3-6 3 6M6 10l6 2 6-2M12 7v7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    upscale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    app: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>',
    printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3m-5 5 5-5 5 5M4 17v4h16v-4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    thumbsUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  };

  const railTabs = [
    { id: 'image', icon: 'image', label: 'Image', badge: 'GPT Image 2.5' },
    { id: 'model', icon: 'spark', label: 'Model', active: true },
    { id: 'segment', icon: 'segment', label: 'Segment', hasArrow: true },
    { id: 'retopo', icon: 'retopo', label: 'Retopo' },
    { id: 'uv', icon: 'uv', label: 'Smart UV' },
    { id: 'texture', icon: 'texture', label: 'Texture', hasArrow: true },
    { id: 'rig', icon: 'rig', label: 'Rig', hasFlame: true, hasArrow: true },
    { id: 'app', icon: 'app', label: 'App' }
  ];

  const hunyuanModels = [
    {
      id: 'hunyuan-2.1',
      name: 'H3.1 – Best Quality',
      subtitle: 'Expect longer wait times · 384+ grid / 50 steps',
      tag: 'Best Quality'
    },
    {
      id: 'hunyuan-2.0',
      name: 'Hunyuan3D-2.0',
      subtitle: 'High Detail · 256 grid / 24 steps',
      tag: 'High Detail'
    },
    {
      id: 'hunyuan-mv',
      name: 'Hunyuan3D-2mv',
      subtitle: 'Multi-View · 2–4 camera angles',
      tag: 'Multi-View'
    },
    {
      id: 'hunyuan-mini',
      name: 'Hunyuan-Mini',
      subtitle: 'Fast · 30s Instant Generation',
      tag: 'Fast'
    },
    {
      id: 'stable-fast-3d',
      name: 'Stable Fast 3D',
      subtitle: 'Textured UV Triangles · Experimental',
      tag: 'UV Mesh'
    }
  ];

  let root, bridge, state, activeRail = 'model', activeTab = 'assets';
  let assets = [], currentUrl = '', error = '', previousFocus, refreshTimer;
  let modelPendingDelete = null;
  let currentRefImageFile = null, currentRefImageUrl = '';
  let activeMatMode = 'pbr';
  let selectedEngine = 'hunyuan-2.1';
  let modelSubMode = 'hd'; // 'hd' or 'smart_mesh'
  const multiViewFiles = new Map(); // 'front', 'left', 'back', 'right'

  const defaultSettings = {
    ultra: true,
    aiComplete: false,
    texture: true,
    textureQuality: '4K',
    removeLighting: false,
    pbr: true,
    topology: 'triangle',
    polycount: 2000000,
    generateInParts: false,
    privacy: 'public'
  };
  let settings = { ...defaultSettings };

  const $ = s => root.querySelector(s);
  const $$ = s => root.querySelectorAll(s);

  function loadSettings() {
    try {
      const saved = localStorage.getItem('aubit_3d_settings');
      if (saved) settings = Object.assign({}, defaultSettings, JSON.parse(saved));
    } catch (_) {}
    applySettingsToUI();
  }

  function saveSettings() {
    try {
      localStorage.setItem('aubit_3d_settings', JSON.stringify(settings));
    } catch (_) {}
  }

  function applySettingsToUI() {
    if (!root) return;
    const ultra = $('#tripo-set-ultra'); if (ultra) ultra.checked = !!settings.ultra;
    const aic = $('#tripo-set-aicomplete'); if (aic) aic.checked = !!settings.aiComplete;
    const tex = $('#tripo-set-texture'); if (tex) tex.checked = !!settings.texture;
    const delight = $('#tripo-set-delight'); if (delight) delight.checked = !!settings.removeLighting;
    const delightAlt = $('#tripo-delight'); if (delightAlt) delightAlt.checked = !!settings.removeLighting;
    const pbr = $('#tripo-set-pbr'); if (pbr) pbr.checked = !!settings.pbr;
    const parts = $('#tripo-set-parts'); if (parts) parts.checked = !!settings.generateInParts;

    const resGroup = $('#tripo-geom-quality-group');
    if (resGroup) {
      resGroup.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.val === settings.textureQuality);
      });
    }

    const topoGroup = $('#tripo-geom-topology-group');
    if (topoGroup) {
      topoGroup.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.val === settings.topology);
      });
    }

    const polySlider = $('#tripo-geom-poly-slider'); if (polySlider) polySlider.value = settings.polycount;
    const polyInput = $('#tripo-geom-poly-input'); if (polyInput) polyInput.value = settings.polycount;
  }

  function mount() {
    root = document.createElement('section');
    root.className = 'a3d';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Tripo 3D Studio');

    root.innerHTML = `
      <!-- 1. TOP BAR -->
      <header class="tripo-topbar">
        <div class="tripo-topbar-left">
          <button type="button" class="tripo-logo-btn" data-action="home" title="TRIPO 3D Workspace">
            ${icons.tripoLogo}
            <span class="tripo-brand-title">TRIPO</span>
          </button>
          <div class="tripo-workspace-badge" data-action="workspace-select">
            <span>3D Workspace</span>
            ${icons.chevronDown}
          </div>
          <nav class="tripo-nav-links">
            <a class="tripo-nav-item" data-action="nav-home">Home</a>
            <a class="tripo-nav-item is-active" data-action="nav-assets">Assets</a>
            <a class="tripo-nav-item" data-action="nav-hub">Creator Hub</a>
            <a class="tripo-nav-item" data-action="nav-resources">Resources ▾</a>
          </nav>
        </div>
        <div class="tripo-topbar-right">
          <button type="button" class="tripo-btn-bridge" data-action="bridge">
            ${icons.cube}
            <span>DCC Bridge</span>
          </button>
          <div class="tripo-credits-pill">
            <span class="tripo-credits-coin">🪙</span>
            <span>25</span>
          </div>
          <button type="button" class="tripo-btn-upgrade" data-action="upgrade">Upgrade</button>
          <div class="tripo-top-icons">
            <button type="button" class="tripo-top-icon-btn" data-action="gift" title="Rewards">${icons.gift}</button>
            <button type="button" class="tripo-top-icon-btn" data-action="notifications" title="Notifications">
              ${icons.bell}
              <span class="tripo-badge-count">28</span>
            </button>
            <div class="tripo-avatar-wrap" data-action="profile" title="User Profile">
              <span style="font-size:14px;font-weight:700;color:#facc15">A</span>
              <span class="tripo-avatar-level">Lv.0</span>
            </div>
            <button type="button" class="tripo-top-icon-btn" data-action="home" title="Close Studio" style="margin-left:4px">
              ${icons.close}
            </button>
          </div>
        </div>
      </header>

      <!-- 2. LEFT RAIL -->
      <nav class="tripo-rail" aria-label="Studio Tools">
        ${railTabs.map(t => `
          <button type="button" class="tripo-rail-item ${t.active ? 'is-active' : ''}" data-rail="${t.id}" title="${t.label}">
            ${t.badge ? `<span class="tripo-rail-badge">${t.badge}</span>` : ''}
            ${icons[t.icon] || icons.cube}
            <span>${t.label} ${t.hasFlame ? '🔥' : ''}${t.hasArrow ? '▾' : ''}</span>
          </button>
        `).join('')}
      </nav>

      <!-- 3. LEFT TOOL PANEL -->
      <aside class="tripo-tool-panel" id="tripo-tool-panel">
        <!-- Dynamic Panel Content Rendered via renderToolPanel() -->
      </aside>

      <!-- 4. FLOATING GEOMETRY & TEXTURE PANEL -->
      <div class="tripo-flyout-panel" id="tripo-geom-panel" hidden>
        <div class="tripo-flyout-head">
          <div>
            <h3>Geometry & Texture</h3>
            <p class="tripo-flyout-sub">We'll automatically save your settings for next time</p>
          </div>
          <button type="button" class="tripo-flyout-close" data-action="close-flyout" aria-label="Close">✕</button>
        </div>

        <div class="tripo-flyout-row">
          <div class="tripo-label-wrap">
            <span>Ultra Mesh Quality</span>
            <span class="tripo-tip" title="Increases marching cubes grid resolution to 384+ and diffusion steps to 50 for ultra-sharp geometric details.">?</span>
          </div>
          <label class="tripo-switch">
            <input type="checkbox" id="tripo-set-ultra" checked>
            <span class="tripo-slider"></span>
          </label>
        </div>

        <div class="tripo-flyout-row">
          <div class="tripo-label-wrap">
            <span>AI Complete</span>
            <span class="tripo-tip" title="Synthesizes coherent 360° geometry and textures for occluded and unseen back surfaces.">?</span>
          </div>
          <label class="tripo-switch">
            <input type="checkbox" id="tripo-set-aicomplete">
            <span class="tripo-slider"></span>
          </label>
        </div>

        <div class="tripo-flyout-row">
          <div class="tripo-label-wrap">
            <span>Texture</span>
          </div>
          <label class="tripo-switch">
            <input type="checkbox" id="tripo-set-texture" checked>
            <span class="tripo-slider"></span>
          </label>
        </div>

        <div class="tripo-field-row">
          <div class="tripo-label-wrap">
            <span>Texture Quality</span>
            <span class="tripo-tip" title="Texture atlas resolution. Higher resolutions preserve razor-sharp logos and micro-details.">?</span>
          </div>
          <div class="tripo-segment-pills" id="tripo-geom-quality-group">
            <button type="button" data-val="2K">2K</button>
            <button type="button" data-val="4K" class="is-active">4K</button>
            <button type="button" data-val="8K">👑 8K</button>
          </div>
        </div>

        <div class="tripo-flyout-row">
          <div class="tripo-label-wrap">
            <span>Remove Lighting <span class="tripo-badge-new">New</span></span>
            <span class="tripo-tip" title="Removes directional shadows and baked lighting highlights from reference photos for a clean albedo/diffuse texture.">?</span>
          </div>
          <label class="tripo-switch">
            <input type="checkbox" id="tripo-set-delight">
            <span class="tripo-slider"></span>
          </label>
        </div>

        <div class="tripo-flyout-row">
          <div class="tripo-label-wrap">
            <span>PBR</span>
            <span class="tripo-tip" title="Physically Based Rendering materials with roughness, metallic, and normal maps for realistic lighting interaction.">?</span>
          </div>
          <label class="tripo-switch">
            <input type="checkbox" id="tripo-set-pbr" checked>
            <span class="tripo-slider"></span>
          </label>
        </div>

        <div class="tripo-field-row">
          <div class="tripo-label-wrap">
            <span>Topology</span>
            <span class="tripo-tip" title="Mesh polygon structure. Quads are ideal for animation and subdivision; triangles are standard for game engines and 3D printing.">?</span>
          </div>
          <div class="tripo-segment-pills" id="tripo-geom-topology-group">
            <button type="button" data-val="quad">□ Quad</button>
            <button type="button" data-val="triangle" class="is-active">△ Triangle</button>
          </div>
        </div>

        <div class="tripo-field-row">
          <div class="tripo-label-wrap">
            <span>Polycount</span>
            <span class="tripo-tip" title="Target polygon count for geometry decimation.">?</span>
          </div>
          <div class="tripo-poly-slider-wrap">
            <div class="tripo-poly-labels">
              <span>500</span>
              <span>2000000</span>
            </div>
            <div class="tripo-poly-input-row">
              <input type="range" id="tripo-geom-poly-slider" min="500" max="2000000" step="5000" value="2000000">
              <input type="number" id="tripo-geom-poly-input" min="500" max="2000000" value="2000000">
            </div>
          </div>
        </div>
      </div>

      <!-- 5. CENTER VIEWPORT -->
      <main class="tripo-canvas">
        <model-viewer
          id="a3d-viewer"
          camera-controls
          touch-action="none"
          shadow-intensity="1.5"
          shadow-softness="0.5"
          exposure="1.0"
          environment-image="neutral"
          interaction-prompt="none"
          alt="Tripo 3D Studio Preview"
          camera-orbit="0deg 75deg auto"
        ></model-viewer>

        <!-- Dynamic Holographic 3D Loading Figure -->
        <div class="tripo-loading-figure" id="tripo-loading-figure" hidden>
          <div class="tripo-figure-mesh">
            <div class="tripo-figure-halo"></div>
            <div class="tripo-figure-cube-wrap">
              <div class="tripo-figure-cube">
                <div class="tripo-cube-face tripo-face-front"></div>
                <div class="tripo-cube-face tripo-face-back"></div>
                <div class="tripo-cube-face tripo-face-right"></div>
                <div class="tripo-cube-face tripo-face-left"></div>
                <div class="tripo-cube-face tripo-face-top"></div>
                <div class="tripo-cube-face tripo-face-bottom"></div>
              </div>
            </div>
          </div>
          <div class="tripo-figure-details">
            <div class="tripo-figure-pct" id="tripo-figure-pct">0%</div>
            <div class="tripo-figure-stage" id="tripo-figure-stage">Synthesizing 3D geometry...</div>
            <div class="tripo-figure-bar">
              <div class="tripo-figure-bar-fill" id="tripo-figure-bar-fill" style="width: 0%;"></div>
            </div>
            <div class="tripo-figure-sub">Local generation · Processing on your machine</div>
          </div>
        </div>

        <!-- Floating Stats Box -->
        <div class="tripo-stats-box" id="tripo-stats-box">
          <div class="tripo-stats-row">
            <span class="tripo-stats-k">Topology</span>
            <span class="tripo-stats-v" id="tripo-stat-topo">Triangle</span>
          </div>
          <div class="tripo-stats-row">
            <span class="tripo-stats-k">Faces</span>
            <span class="tripo-stats-v" id="tripo-stat-faces">50,000 / 50,000</span>
          </div>
          <div class="tripo-stats-row">
            <span class="tripo-stats-k">Vertices</span>
            <span class="tripo-stats-v" id="tripo-stat-verts">25,002 / 25,002</span>
          </div>
        </div>

        <!-- 3D RGB Orientation Gizmo -->
        <div class="tripo-gizmo" title="XYZ Orientation">
          <svg class="tripo-gizmo-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="rgba(24, 24, 24, 0.75)" stroke="#383838" stroke-width="1.5"/>
            <!-- X Axis (Red) -->
            <line x1="50" y1="50" x2="80" y2="50" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
            <circle cx="80" cy="50" r="4.5" fill="#ef4444"/>
            <text x="88" y="53" fill="#ef4444" font-size="10" font-weight="bold">X</text>
            <!-- Y Axis (Green) -->
            <line x1="50" y1="50" x2="50" y2="20" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
            <circle cx="50" cy="20" r="4.5" fill="#22c55e"/>
            <text x="47" y="13" fill="#22c55e" font-size="10" font-weight="bold">Y</text>
            <!-- Z Axis (Blue) -->
            <line x1="50" y1="50" x2="30" y2="70" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
            <circle cx="30" cy="70" r="4.5" fill="#3b82f6"/>
            <text x="21" y="78" fill="#3b82f6" font-size="10" font-weight="bold">Z</text>
          </svg>
        </div>

        <!-- Floating Viewport Tools on Right Edge -->
        <div class="tripo-viewport-tools">
          <button type="button" class="tripo-tool-btn" data-action="light" title="Toggle Studio Lighting">${icons.sun}</button>
          <button type="button" class="tripo-tool-btn" data-action="snapshot" title="Take High-Res Snapshot">${icons.camera}</button>
          <button type="button" class="tripo-tool-btn" data-action="wireframe" title="Toggle Wireframe / Grid">${icons.grid}</button>
          <button type="button" class="tripo-tool-btn" data-action="reset" title="Reset Camera">${icons.reset}</button>
          <button type="button" class="tripo-tool-btn" data-action="help" title="Tripo Guide">${icons.help}</button>
        </div>

        <!-- Floating Shading Material Spheres -->
        <div class="tripo-material-bar">
          <div class="tripo-mat-sphere is-active" data-mat="pbr" title="PBR Colored" style="background: linear-gradient(135deg, #facc15, #8b5cf6, #06b6d4);"></div>
          <div class="tripo-mat-sphere" data-mat="clay" title="MatCap Clay" style="background: #998070;"></div>
          <div class="tripo-mat-sphere" data-mat="normal" title="Normal Tangent Map" style="background: linear-gradient(135deg, #6688ee, #77ffaa, #ff88aa);"></div>
          <div class="tripo-mat-sphere" data-mat="gold" title="Metallic Gold" style="background: linear-gradient(135deg, #ffe066, #b8860b, #fff8dc);"></div>
          <div class="tripo-mat-sphere" data-mat="unlit" title="Unlit Flat Color" style="background: #333333;"></div>
        </div>

        <!-- Floating Bottom Action Bar -->
        <div class="tripo-bottom-actions">
          <div class="tripo-bottom-left">
            <button type="button" class="tripo-action-icon" data-action="undo" title="Undo">${icons.undo}</button>
            <button type="button" class="tripo-action-icon" data-action="redo" title="Redo">${icons.redo}</button>
          </div>
          <div class="tripo-bottom-right">
            <button type="button" class="tripo-pill-btn" data-action="download-stl">${icons.printer} 3D Print</button>
            <button type="button" class="tripo-pill-btn" data-action="share">${icons.share} Share</button>
            <button type="button" class="tripo-export-btn" data-action="open-export">${icons.down} Export ⬇</button>
          </div>
        </div>

        <!-- Floating Bottom Progress Overlay -->
        <div class="tripo-progress-overlay" id="tripo-progress" hidden>
          <div class="tripo-progress-head">
            <strong id="tripo-stage-label">Generating 3D model...</strong>
            <span id="tripo-percent-label">45%</span>
          </div>
          <div class="tripo-prog-bar">
            <div class="tripo-prog-fill" id="tripo-prog-fill" style="width: 45%;"></div>
          </div>
        </div>

        <!-- Toast / Status message -->
        <div id="a3d-message" class="a3d-message" role="status" hidden></div>
      </main>

      <!-- 6. RIGHT SIDEBAR (ASSETS) -->
      <aside class="tripo-sidebar">
        <div class="tripo-sidebar-tabs">
          <button type="button" class="tripo-tab is-active" data-tab="assets">
            ${icons.folder}
            <span>Assets</span>
          </button>
          <button type="button" class="tripo-tab" data-tab="property">
            ${icons.sliders}
            <span>Property</span>
          </button>
        </div>

        <!-- Memory Usage Card -->
        <div class="tripo-memory-card">
          <div class="tripo-mem-head">
            <div class="tripo-mem-title">⚡ Memory Usage</div>
            <button type="button" class="tripo-btn-up-sm" data-action="upgrade">Upgrade</button>
          </div>
          <div class="tripo-progress-wrap">
            <div class="tripo-mem-bar">
              <div class="tripo-mem-fill" id="tripo-mem-fill" style="width: 100%;"></div>
            </div>
            <span class="tripo-mem-count" id="tripo-mem-count">15 / 10</span>
          </div>
          <p class="tripo-mem-sub">Insufficient memory! Please upgrade plan to continue generating or delete unused models.</p>
        </div>

        <!-- Filter Bar -->
        <div class="tripo-filter-bar">
          <div class="tripo-filter-left">
            <button type="button" class="tripo-filter-icon is-active" data-action="filter-all" title="All assets">${icons.grid}</button>
            <button type="button" class="tripo-filter-icon" data-action="filter-star" title="Starred">${icons.star}</button>
            <button type="button" class="tripo-filter-icon" data-action="filter-type" title="Filter">${icons.filter}</button>
          </div>
          <button type="button" class="tripo-btn-manage" data-action="manage">Manage</button>
        </div>

        <!-- Assets 2-Column Grid -->
        <div class="tripo-assets-grid" id="tripo-assets-grid">
          <!-- Card 1: Upload Card -->
          <div class="tripo-upload-card" data-action="upload-model-card" title="Upload local GLB/OBJ/STL model">
            <div class="tripo-upload-circle">${icons.upload}</div>
            <strong>Upload 3D Model</strong>
            <small>GLB, OBJ, STL</small>
            <span class="tripo-upload-lim">Unlimited</span>
            <input type="file" id="tripo-upload-model-input" accept=".glb,.gltf,.stl,.obj" style="display:none;" />
          </div>
        </div>
      </aside>

      <!-- Export Modal Dialog -->
      <dialog id="tripo-export-dialog" class="tripo-export-dialog">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="font-size:16px;font-weight:700;">Export 3D Model</h2>
          <button type="button" class="tripo-ref-btn" data-action="close-export">${icons.close}</button>
        </div>
        <p style="font-size:12px;color:#a1a1aa;margin-bottom:18px;">Select export format for game engines, 3D printing, or animation:</p>
        <div class="tripo-export-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button type="button" class="tripo-export-card-btn" data-action="download-glb">
            <strong style="color:#facc15">GLB / glTF</strong>
            <small>PBR Material + UV Texture</small>
          </button>
          <button type="button" class="tripo-export-card-btn" data-action="download-stl">
            <strong style="color:#a855f7">STL</strong>
            <small>Watertight 3D Printing</small>
          </button>
          <button type="button" class="tripo-export-card-btn" data-action="download-glb">
            <strong style="color:#38bdf8">OBJ + MTL</strong>
            <small>Universal 3D Mesh</small>
          </button>
          <button type="button" class="tripo-export-card-btn" data-action="download-glb">
            <strong style="color:#4ade80">USDZ</strong>
            <small>Apple AR / iOS QuickLook</small>
          </button>
        </div>
      </dialog>

      <!-- Delete Confirmation Modal Dialog -->
      <dialog id="a3d-delete-dialog" class="a3d-delete-dialog">
        <div class="a3d-dialog-head">
          <div>
            <h2>Delete 3D Model?</h2>
            <p class="a3d-dialog-sub">Permanently remove this asset from your library</p>
          </div>
          <button type="button" class="a3d-dialog-close" data-action="cancel-delete" aria-label="Cancel">×</button>
        </div>
        <div class="a3d-dialog-body">
          <p id="a3d-delete-msg" class="a3d-dialog-desc">Are you sure you want to permanently delete this model? The GLB, STL, and texture files will be removed from your machine.</p>
        </div>
        <div class="a3d-dialog-footer">
          <button type="button" class="a3d-btn-cancel" data-action="cancel-delete">Cancel</button>
          <button type="button" class="a3d-btn-danger" data-action="confirm-delete">${icons.trash} Delete Model</button>
        </div>
      </dialog>

      <!-- Help / Guide Dialog -->
      <dialog id="a3d-guide">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="font-size:16px;font-weight:700;">Tripo 3D Studio Guide</h2>
          <button type="button" class="tripo-ref-btn" data-action="close-guide">${icons.close}</button>
        </div>
        <ol style="font-size:12px;color:#d4d4d8;line-height:1.7;padding-left:18px;">
          <li><strong>Upload or Generate:</strong> Drop a reference photo into the left panel card or pick from past models on the right.</li>
          <li><strong>Hunyuan AI Models:</strong> Switch between H3.1 (Best Quality), Hunyuan3D-2.0, Hunyuan3D-2mv (Multi-View), and Hunyuan-Mini (Fast).</li>
          <li><strong>Hunyuan3D-2mv:</strong> Provides multi-angle camera slots (Front, Left, Back, Right) for 360° fidelity.</li>
          <li><strong>Geometry & Texture Flyout:</strong> Toggle Ultra Mesh Quality, AI Complete, PBR, Topology, and Polycount anytime.</li>
          <li><strong>Instant Preview:</strong> Left-click any model card on the right to load and interact with it in real-time.</li>
          <li><strong>Export:</strong> Download GLB, STL (3D Print), or OBJ files anytime.</li>
        </ol>
        <button type="button" class="tripo-btn-generate" data-action="close-guide" style="margin-top:16px;height:38px;">Got It</button>
      </dialog>
    `;

    document.body.append(root);

    renderToolPanel();

    // Bind event listeners
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);

    // Model viewer error handler
    $('#a3d-viewer').addEventListener('error', () => {
      showError('3D preview could not load the GLB model.');
    });

    // Close on backdrop click for dialogs
    const expDiag = $('#tripo-export-dialog');
    if (expDiag) expDiag.addEventListener('click', e => { if (e.target === expDiag) expDiag.close(); });
    const delDiag = $('#a3d-delete-dialog');
    if (delDiag) delDiag.addEventListener('click', e => { if (e.target === delDiag) { modelPendingDelete = null; delDiag.close(); } });
    const guideDiag = $('#a3d-guide');
    if (guideDiag) guideDiag.addEventListener('click', e => { if (e.target === guideDiag) guideDiag.close(); });

    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if ($('#tripo-export-dialog')?.open) $('#tripo-export-dialog').close();
        else if ($('#a3d-delete-dialog')?.open) { modelPendingDelete = null; $('#a3d-delete-dialog').close(); }
        else if ($('#a3d-guide')?.open) $('#a3d-guide').close();
        else if (!$('#tripo-geom-panel').hidden) $('#tripo-geom-panel').hidden = true;
        else bridge.close();
      }
    });

    loadSettings();
  }

  function renderToolPanel() {
    const panel = $('#tripo-tool-panel');
    if (!panel) return;

    if (activeRail === 'model') {
      const curEngine = hunyuanModels.find(m => m.id === selectedEngine) || hunyuanModels[0];
      const isMultiView = selectedEngine === 'hunyuan-mv';

      panel.innerHTML = `
        <div class="tripo-panel-header">
          ${icons.spark}
          <span>${isMultiView ? 'Hunyuan3D-2mv (Multi-View)' : 'Generate Model'}</span>
        </div>

        <!-- Mode Subnav: HD Model vs Smart Mesh -->
        <div class="tripo-model-subnav">
          <button type="button" class="${modelSubMode === 'hd' ? 'is-active' : ''}" data-action="submode-hd">HD Model</button>
          <button type="button" class="${modelSubMode === 'smart_mesh' ? 'is-active' : ''}" data-action="submode-smart">Smart Mesh ⚡</button>
        </div>

        ${isMultiView ? `
          <!-- Multi-View Angles Grid -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
            <span class="tripo-section-label" style="margin:0;">Multi-View References</span>
            <span style="font-size:10px;font-weight:700;color:#facc15;" id="tripo-mv-count">${multiViewFiles.size} / 4 angles</span>
          </div>
          <p style="font-size:10px;color:#71717a;margin:0 0 2px 0;">Upload front + matching side/back views</p>

          <div class="tripo-multiview-grid">
            ${['front', 'left', 'back', 'right'].map(view => {
              const fileObj = multiViewFiles.get(view);
              return `
                <div class="tripo-multiview-slot ${fileObj ? 'has-image' : ''}" data-view="${view}" title="Upload ${view} view">
                  <span class="tripo-multiview-badge">${view}</span>
                  ${fileObj ? `
                    <img src="${esc(fileObj.url)}" alt="${view}" />
                    <div class="tripo-multiview-actions">
                      <button type="button" class="tripo-mv-btn" data-action="rotate-mv" data-view="${view}" title="Rotate 90°">${icons.reset}</button>
                      <button type="button" class="tripo-mv-btn" data-action="delete-mv" data-view="${view}" title="Remove angle">${icons.trash}</button>
                    </div>
                  ` : `
                    <div class="tripo-checker-icon" style="opacity:0.4;">${icons.camera}</div>
                    <small style="color:#71717a;font-size:9.5px;margin-top:2px;">Click to upload</small>
                  `}
                  <input type="file" data-mv-input="${view}" accept="image/png,image/jpeg,image/webp" style="display:none;" />
                </div>
              `;
            }).join('')}
          </div>

          <button type="button" class="tripo-multiview-batch" data-action="batch-upload-btn">
            ${icons.image}
            <span>Upload several angles at once</span>
            <input type="file" id="tripo-batch-file-input" multiple accept="image/png,image/jpeg,image/webp" style="display:none;" />
          </button>
        ` : `
          <!-- Single Reference Upload Card -->
          <div class="tripo-checker-card" id="tripo-model-dropzone" title="Click or drop reference image">
            ${currentRefImageUrl ? `
              <img src="${esc(currentRefImageUrl)}" alt="" style="width:100%;height:100%;object-fit:contain;padding:10px;pointer-events:none;" />
              <button type="button" class="tripo-ref-btn del" data-action="clear-ref" title="Clear image" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);">${icons.trash}</button>
            ` : `
              <div class="tripo-checker-center">
                <div class="tripo-checker-icon">${icons.image}</div>
                <strong>Upload</strong>
                <small>JPG, PNG, WEBP Size ≤ 20MB</small>
              </div>
              <div class="tripo-checker-bottom-pill" data-action="gen-image-prompt">
                <span>Generate Image for 3D</span>
                ${icons.chevronRight}
              </div>
            `}
            <input type="file" id="tripo-model-file-input" accept="image/png,image/jpeg,image/webp" style="display:none;" />
          </div>
        `}

        <!-- General Settings Section -->
        <div class="tripo-section-label">General Settings</div>
        <button type="button" class="tripo-row-btn" data-action="toggle-geometry">
          <span>Geometry & Texture</span>
          ${icons.chevronRight}
        </button>

        <!-- Members Only Section -->
        <div class="tripo-section-label gold">👑 Members Only</div>
        <div class="tripo-member-row">
          <div class="tripo-label-wrap">
            <span>Generate in Parts <span class="tripo-tip" title="Separates complex characters and items into modular articulated components">?</span> <span class="tripo-badge-trial">Trial ×1</span></span>
          </div>
          <label class="tripo-switch">
            <input type="checkbox" id="tripo-set-parts" ${settings.generateInParts ? 'checked' : ''}>
            <span class="tripo-slider"></span>
          </label>
        </div>
        <div class="tripo-member-row">
          <div class="tripo-label-wrap">
            <span>8K Texture <span class="tripo-tip" title="Ultra HD 8192x8192 diffuse/normal maps">?</span></span>
          </div>
          <label class="tripo-switch">
            <input type="checkbox" id="tripo-set-8k" ${settings.textureQuality === '8K' ? 'checked' : ''}>
            <span class="tripo-slider"></span>
          </label>
        </div>
        <div class="tripo-member-row">
          <div class="tripo-label-wrap">
            <span>Privacy <span class="tripo-tip" title="Asset access permission">?</span></span>
          </div>
          <div class="tripo-privacy-pill" data-action="toggle-privacy">
            <span>🌐 ${settings.privacy === 'private' ? 'Private' : 'Public'}</span>
            <span>▾</span>
          </div>
        </div>

        <!-- AI Model Section -->
        <div class="tripo-section-label">AI Model</div>
        <div class="tripo-ai-model-card" data-action="toggle-ai-dropdown">
          <div class="tripo-ai-model-icon">
            ${icons.thumbsUp}
          </div>
          <div class="tripo-ai-model-text">
            <strong id="tripo-ai-name">${esc(curEngine.name)}</strong>
            <small id="tripo-ai-sub">${esc(curEngine.subtitle)}</small>
          </div>
          <span id="tripo-ai-chevron">${icons.chevronDown}</span>

          <div class="tripo-ai-dropdown" id="tripo-ai-dropdown" hidden>
            ${hunyuanModels.map(m => `
              <button type="button" class="tripo-ai-option ${m.id === selectedEngine ? 'is-active' : ''}" data-engine="${m.id}">
                <div class="tripo-ai-option-title">
                  <span>${esc(m.name)}</span>
                  ${m.tag ? `<span class="tripo-badge-new" style="background:#2c224a;color:#a78bfa">${esc(m.tag)}</span>` : ''}
                </div>
                <div class="tripo-ai-option-sub">${esc(m.subtitle)}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Yellow Generate Action Button -->
        <button type="button" class="tripo-btn-generate" data-action="generate">
          <span>Generate</span>
          <span style="display:flex;align-items:center;gap:3px;"><span style="font-size:15px">⚡</span> 55</span>
        </button>
      `;

      if (!isMultiView) {
        bindDropzone($('#tripo-model-dropzone'), $('#tripo-model-file-input'));
      }
    } else {
      // Texture or other mode
      panel.innerHTML = `
        <div class="tripo-panel-header">
          ${icons.texture}
          <span id="tripo-panel-title">3D Model Texture Generator</span>
        </div>

        <!-- Glowing Reference Card -->
        <div class="tripo-ref-card">
          <div class="tripo-ref-toolbar">
            <button type="button" class="tripo-ref-btn" data-action="upload-ref-btn" title="Upload Reference Image">${icons.image}</button>
            <button type="button" class="tripo-ref-btn" data-action="ref-wire" title="Wireframe mode">${icons.cube}</button>
            <button type="button" class="tripo-ref-btn" data-action="ref-draw" title="Draw brush">${icons.pencil}</button>
            <button type="button" class="tripo-ref-btn del" data-action="clear-ref" title="Clear image">${icons.trash}</button>
          </div>

          <div class="tripo-ref-img-frame" id="tripo-ref-dropzone" title="Click or drop reference image">
            <img class="tripo-ref-img" id="tripo-ref-img" alt="" style="${currentRefImageUrl ? 'display:block;' : 'display:none;'}" src="${esc(currentRefImageUrl || '')}" />
            <div class="tripo-ref-placeholder" id="tripo-ref-placeholder" style="${currentRefImageUrl ? 'display:none;' : 'display:flex;'}">
              ${icons.image}
              <span>Click or Drop Image</span>
              <small style="color:#71717a;font-size:9.5px">PNG, JPG, WEBP up to 10MB</small>
            </div>
            <input type="file" id="tripo-ref-file-input" accept="image/png,image/jpeg,image/webp" style="display:none;" />
          </div>
        </div>

        <!-- Style Selector -->
        <div class="tripo-field-row">
          <div class="tripo-style-selector" data-action="style-select">
            <span>Create Your Own Texture Style</span>
            ${icons.chevronDown}
          </div>
        </div>

        <!-- Remove Lighting Toggle -->
        <div class="tripo-field-row">
          <div class="tripo-toggle-row">
            <div class="tripo-label-wrap">
              <span>Remove Lighting <span class="tripo-badge-new">New</span></span>
              <span class="tripo-tip" title="Extracts clean albedo diffuse maps by decoupling baked shadows and highlights">?</span>
            </div>
            <label class="tripo-switch">
              <input type="checkbox" id="tripo-delight" ${settings.removeLighting ? 'checked' : ''}>
              <span class="tripo-slider"></span>
            </label>
          </div>
        </div>

        <!-- Texture Resolution Pills -->
        <div class="tripo-field-row">
          <div class="tripo-label-wrap">
            <span>Texture Resolution</span>
            <span class="tripo-tip" title="Select atlas texture bake resolution">?</span>
          </div>
          <div class="tripo-segment-pills" id="tripo-res-group">
            <button type="button" data-val="2K" class="${settings.textureQuality === '2K' ? 'is-active' : ''}">2K</button>
            <button type="button" data-val="4K" class="${settings.textureQuality === '4K' ? 'is-active' : ''}">4K</button>
            <button type="button" data-val="8K" class="${settings.textureQuality === '8K' ? 'is-active' : ''}">8K</button>
          </div>
        </div>

        <!-- Yellow Generate Action Button -->
        <button type="button" class="tripo-btn-generate" data-action="generate">
          <span id="tripo-btn-gen-text">Generate Texture</span>
          <span>🪙 20</span>
        </button>
      `;

      bindDropzone($('#tripo-ref-dropzone'), $('#tripo-ref-file-input'));
    }

    applySettingsToUI();
  }

  function bindDropzone(dropzone, input) {
    if (!dropzone || !input) return;
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--tripo-yellow)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      if (e.dataTransfer.files?.[0]) handleRefFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', e => {
      if (!e.target.closest('button')) {
        input.click();
      }
    });
  }

  function showError(msg) {
    error = msg;
    renderStatus();
  }

  function handleRefFile(file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return showError('Reference image must be under 20 MB.');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return showError('Select PNG, JPG, or WEBP image.');

    if (currentRefImageUrl && currentRefImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentRefImageUrl);
    }
    currentRefImageFile = file;
    currentRefImageUrl = URL.createObjectURL(file);

    // Also populate multiView 'front' if empty
    if (!multiViewFiles.has('front')) {
      multiViewFiles.set('front', { file, url: currentRefImageUrl });
    }

    renderToolPanel();
    error = '';
    renderStatus();
  }

  function handleMultiViewFile(view, file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return showError('Angle image must be under 20 MB.');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return showError('Select PNG, JPG, or WEBP image.');

    const old = multiViewFiles.get(view);
    if (old && old.url.startsWith('blob:')) URL.revokeObjectURL(old.url);

    const url = URL.createObjectURL(file);
    multiViewFiles.set(view, { file, url });

    if (view === 'front') {
      currentRefImageFile = file;
      currentRefImageUrl = url;
    }

    renderToolPanel();
    error = '';
    renderStatus();
  }

  async function rotateMultiViewFile(view) {
    const item = multiViewFiles.get(view);
    if (!item) return;
    try {
      const bitmap = await createImageBitmap(item.file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.height;
      canvas.height = bitmap.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
      bitmap.close();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const newFile = new File([blob], item.file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
      handleMultiViewFile(view, newFile);
    } catch (_) {}
  }

  async function loadLibrary() {
    try {
      const data = await bridge.library();
      assets = data.models || [];
      renderAssets();
      if (!state.model3dTask && assets.length > 0) {
        state.model3dTask = assets[0];
        bridge.select(assets[0]);
      }
    } catch (e) {
      showError(e.message || 'Could not load assets library');
    }
  }

  function renderAssets() {
    const grid = $('#tripo-assets-grid');
    if (!grid) return;

    const count = assets.length;
    const memCount = $('#tripo-mem-count');
    if (memCount) memCount.textContent = `${count} / 10`;
    const memFill = $('#tripo-mem-fill');
    if (memFill) {
      const pct = Math.min(100, Math.round((count / 10) * 100));
      memFill.style.width = `${pct}%`;
    }

    const uploadCardHtml = `
      <div class="tripo-upload-card" data-action="upload-model-card" title="Upload local GLB/OBJ/STL model">
        <div class="tripo-upload-circle">${icons.upload}</div>
        <strong>Upload 3D Model</strong>
        <small>GLB, OBJ, STL</small>
        <span class="tripo-upload-lim">Unlimited</span>
        <input type="file" id="tripo-upload-model-input" accept=".glb,.gltf,.stl,.obj" style="display:none;" />
      </div>
    `;

    const cardsHtml = assets.map((asset, i) => {
      const thumbUrl = asset.model_urls?.thumbnail ? bridge.url(asset.model_urls.thumbnail, 'png') : '';
      const glbUrl = bridge.url(asset.model_urls?.glb, 'glb');
      const isSelected = state.model3dTask?.id === asset.id;

      const mediaHtml = thumbUrl
        ? `<img src="${esc(thumbUrl)}" alt="" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" /><div class="tripo-asset-thumb-icon" style="display:none;">${icons.cube}</div>`
        : glbUrl
          ? `<model-viewer src="${esc(glbUrl)}" loading="lazy" reveal="auto" interaction-prompt="none"></model-viewer>`
          : `<div class="tripo-asset-thumb-icon">${icons.cube}</div>`;

      return `
        <div class="tripo-asset-card ${isSelected ? 'is-selected' : ''}" data-asset="${i}" title="${esc(asset.interpreted_as || 'Local Model')} · Left-click to preview">
          ${mediaHtml}
          <button type="button" class="tripo-asset-del-btn" data-action="delete-asset" data-asset="${i}" title="Delete model">
            ${icons.trash}
          </button>
          <button type="button" class="tripo-asset-info-btn" data-action="asset-info" data-asset="${i}" title="Details">
            ${icons.info}
          </button>
        </div>
      `;
    }).join('');

    grid.innerHTML = uploadCardHtml + cardsHtml;

    if (state.model3dTask) {
      syncRefToModel(state.model3dTask);
    }
  }

  function syncRefToModel(model) {
    if (!model) return;
    if (model.model_urls?.thumbnail && !currentRefImageFile) {
      currentRefImageUrl = bridge.url(model.model_urls.thumbnail, 'png');
      const img = $('#tripo-ref-img');
      if (img) {
        img.src = currentRefImageUrl;
        img.style.display = 'block';
        const ph = $('#tripo-ref-placeholder');
        if (ph) ph.style.display = 'none';
      }
    }
    const faces = Number(model.triangle_count || model.quality?.triangle_count || 50000);
    const verts = Math.round(faces * 0.50004);
    const topo = model.settings?.topology || 'Triangle';

    const statFaces = $('#tripo-stat-faces');
    if (statFaces) statFaces.textContent = `${faces.toLocaleString()} / ${faces.toLocaleString()}`;
    const statVerts = $('#tripo-stat-verts');
    if (statVerts) statVerts.textContent = `${verts.toLocaleString()} / ${verts.toLocaleString()}`;
    const statTopo = $('#tripo-stat-topo');
    if (statTopo) statTopo.textContent = topo[0].toUpperCase() + topo.slice(1);
  }

  function renderStatus() {
    const task = state.model3dTask;
    const isBusy = !!state.model3dBusy;
    const message = error || state.model3dError || state.model3dNotice || '';
    const msgEl = $('#a3d-message');
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.hidden = !message;
      msgEl.classList.toggle('is-error', !!(error || state.model3dError));
    }

    // Dynamic Central 3D Holographic Loading Figure
    const figureEl = $('#tripo-loading-figure');
    if (figureEl) {
      figureEl.hidden = !isBusy;
      if (isBusy) {
        const rawPct = Number(task?.progress ?? 0);
        const stage = task?.stage || state.model3dNotice || 'Synthesizing 3D geometry...';
        const pctText = `${Math.min(100, Math.max(0, Math.round(rawPct)))}%`;

        const figPct = $('#tripo-figure-pct');
        if (figPct) figPct.textContent = pctText;

        const figStage = $('#tripo-figure-stage');
        if (figStage) figStage.textContent = stage;

        const figBar = $('#tripo-figure-bar-fill');
        if (figBar) figBar.style.width = pctText;
      }
    }

    // Floating progress overlay
    const progEl = $('#tripo-progress');
    if (progEl) {
      progEl.hidden = !isBusy;
      if (isBusy) {
        const stageLabel = $('#tripo-stage-label');
        if (stageLabel) stageLabel.textContent = task?.stage || 'Generating 3D model...';
        const pctLabel = $('#tripo-percent-label');
        if (pctLabel) pctLabel.textContent = `${task?.progress || 0}%`;
        const fill = $('#tripo-prog-fill');
        if (fill) fill.style.width = `${task?.progress || 0}%`;
      }
    }

    const genBtn = $('[data-action="generate"]');
    if (genBtn) genBtn.disabled = isBusy;

    const viewer = $('#a3d-viewer');
    if (viewer) {
      if (isBusy) {
        viewer.style.opacity = '0.15';
      } else {
        viewer.style.opacity = '1';
        const url = task?.status === 'SUCCEEDED' ? bridge.url(task.model_urls?.glb, 'glb') : '';
        if (url && url !== currentUrl) {
          currentUrl = url;
          viewer.src = url;
          syncRefToModel(task);
        }
      }
    }
  }

  function applyShadingMode(mode) {
    activeMatMode = mode;
    $$('.tripo-mat-sphere').forEach(s => s.classList.toggle('is-active', s.dataset.mat === mode));
    const viewer = $('#a3d-viewer');
    if (!viewer) return;

    if (mode === 'pbr') {
      viewer.exposure = 1.0;
      viewer.shadowIntensity = 1.5;
    } else if (mode === 'clay') {
      viewer.exposure = 0.9;
      viewer.shadowIntensity = 2.0;
    } else if (mode === 'normal') {
      viewer.exposure = 1.3;
      viewer.shadowIntensity = 0.2;
    } else if (mode === 'gold') {
      viewer.exposure = 1.4;
      viewer.shadowIntensity = 1.0;
    } else if (mode === 'unlit') {
      viewer.exposure = 1.2;
      viewer.shadowIntensity = 0.0;
    }
  }

  function takeSnapshot() {
    const viewer = $('#a3d-viewer');
    if (!viewer) return;
    try {
      const dataUrl = viewer.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tripo-3d-model-${Date.now()}.png`;
      a.click();
    } catch (_) {
      showError('Unable to snapshot viewport canvas');
    }
  }

  function onInput(e) {
    const el = e.target;
    if (el.id === 'tripo-geom-poly-slider') {
      const input = $('#tripo-geom-poly-input');
      if (input) input.value = el.value;
      settings.polycount = Number(el.value);
      saveSettings();
    }
  }

  async function onChange(e) {
    const el = e.target;

    // Single view input
    if (el.id === 'tripo-model-file-input' || el.id === 'tripo-ref-file-input') {
      if (el.files?.[0]) handleRefFile(el.files[0]);
      el.value = '';
    }

    // Specific Multi-View angle input
    if (el.dataset.mvInput) {
      const view = el.dataset.mvInput;
      if (el.files?.[0]) handleMultiViewFile(view, el.files[0]);
      el.value = '';
    }

    // Batch Multi-View upload input
    if (el.id === 'tripo-batch-file-input') {
      const filesArr = [...(el.files || [])];
      const views = ['front', 'left', 'back', 'right'];
      for (let i = 0; i < Math.min(filesArr.length, 4); i++) {
        handleMultiViewFile(views[i], filesArr[i]);
      }
      el.value = '';
    }

    if (el.id === 'tripo-upload-model-input') {
      const file = el.files?.[0];
      if (file) {
        const fileUrl = URL.createObjectURL(file);
        const viewer = $('#a3d-viewer');
        if (viewer) {
          viewer.src = fileUrl;
          currentUrl = fileUrl;
        }
        showError('');
        state.model3dNotice = `Loaded model ${file.name}`;
        renderStatus();
      }
      el.value = '';
    }
    if (el.id === 'tripo-set-ultra') { settings.ultra = el.checked; saveSettings(); }
    if (el.id === 'tripo-set-aicomplete') { settings.aiComplete = el.checked; saveSettings(); }
    if (el.id === 'tripo-set-texture') { settings.texture = el.checked; saveSettings(); }
    if (el.id === 'tripo-set-delight' || el.id === 'tripo-delight') {
      settings.removeLighting = el.checked;
      const other = el.id === 'tripo-set-delight' ? $('#tripo-delight') : $('#tripo-set-delight');
      if (other) other.checked = el.checked;
      saveSettings();
    }
    if (el.id === 'tripo-set-pbr') { settings.pbr = el.checked; saveSettings(); }
    if (el.id === 'tripo-set-parts') { settings.generateInParts = el.checked; saveSettings(); }
    if (el.id === 'tripo-set-8k') {
      settings.textureQuality = el.checked ? '8K' : '4K';
      applySettingsToUI();
      saveSettings();
    }
    if (el.id === 'tripo-geom-poly-input') {
      let val = Math.round(Number(el.value) || 50000);
      val = Math.max(500, Math.min(2000000, val));
      el.value = val;
      const slider = $('#tripo-geom-poly-slider');
      if (slider) slider.value = val;
      settings.polycount = val;
      saveSettings();
    }
  }

  async function onClick(e) {
    // Multi-View slot click
    const mvSlot = e.target.closest('.tripo-multiview-slot');
    if (mvSlot && !e.target.closest('button')) {
      const view = mvSlot.dataset.view;
      const input = root.querySelector(`input[data-mv-input="${view}"]`);
      if (input) input.click();
      return;
    }

    // Multi-View slot actions
    const rotBtn = e.target.closest('[data-action="rotate-mv"]');
    if (rotBtn) {
      e.stopPropagation();
      rotateMultiViewFile(rotBtn.dataset.view);
      return;
    }
    const delMvBtn = e.target.closest('[data-action="delete-mv"]');
    if (delMvBtn) {
      e.stopPropagation();
      const view = delMvBtn.dataset.view;
      const item = multiViewFiles.get(view);
      if (item && item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      multiViewFiles.delete(view);
      if (view === 'front') {
        currentRefImageFile = null;
        currentRefImageUrl = '';
      }
      renderToolPanel();
      return;
    }

    if (e.target.closest('[data-action="batch-upload-btn"]')) {
      $('#tripo-batch-file-input')?.click();
      return;
    }

    // Submode switches
    if (e.target.closest('[data-action="submode-hd"]')) {
      modelSubMode = 'hd';
      renderToolPanel();
      return;
    }
    if (e.target.closest('[data-action="submode-smart"]')) {
      modelSubMode = 'smart_mesh';
      renderToolPanel();
      return;
    }

    // Toggle Flyout Geometry Panel
    if (e.target.closest('[data-action="toggle-geometry"]')) {
      const panel = $('#tripo-geom-panel');
      if (panel) panel.hidden = !panel.hidden;
      return;
    }
    if (e.target.closest('[data-action="close-flyout"]')) {
      const panel = $('#tripo-geom-panel');
      if (panel) panel.hidden = true;
      return;
    }

    // Toggle AI Model dropdown
    if (e.target.closest('[data-action="toggle-ai-dropdown"]') && !e.target.closest('.tripo-ai-option')) {
      const dd = $('#tripo-ai-dropdown');
      if (dd) dd.hidden = !dd.hidden;
      return;
    }

    // AI Model selection option
    const aiOpt = e.target.closest('.tripo-ai-option');
    if (aiOpt) {
      selectedEngine = aiOpt.dataset.engine;
      renderToolPanel();
      return;
    }

    // Quality pills inside Geometry panel or Tool panel
    const resBtn = e.target.closest('#tripo-geom-quality-group button, #tripo-res-group button');
    if (resBtn) {
      settings.textureQuality = resBtn.dataset.val;
      $$('#tripo-geom-quality-group button, #tripo-res-group button').forEach(b => {
        b.classList.toggle('is-active', b.dataset.val === settings.textureQuality);
      });
      const set8k = $('#tripo-set-8k');
      if (set8k) set8k.checked = settings.textureQuality === '8K';
      saveSettings();
      return;
    }

    // Topology pills
    const topoBtn = e.target.closest('#tripo-geom-topology-group button');
    if (topoBtn) {
      settings.topology = topoBtn.dataset.val;
      $$('#tripo-geom-topology-group button').forEach(b => b.classList.toggle('is-active', b === topoBtn));
      saveSettings();
      return;
    }

    // Material spheres
    const matSphere = e.target.closest('.tripo-mat-sphere');
    if (matSphere) {
      applyShadingMode(matSphere.dataset.mat);
      return;
    }

    // Left Rail switches
    const railBtn = e.target.closest('.tripo-rail-item');
    if (railBtn) {
      $$('.tripo-rail-item').forEach(b => b.classList.remove('is-active'));
      railBtn.classList.add('is-active');
      activeRail = railBtn.dataset.rail;
      renderToolPanel();
      return;
    }

    // Action clicks
    const target = e.target.closest('[data-action]');
    if (target && !target.disabled) {
      const action = target.dataset.action;
      error = '';

      if (action === 'home') return bridge.close();
      if (action === 'upgrade') {
        alert('You are running Aubit Tripo 3D Local Pro Edition.\nGenerations run offline directly on your hardware!');
        return;
      }
      if (action === 'help') return $('#a3d-guide').showModal();
      if (action === 'close-guide') return $('#a3d-guide').close();
      if (action === 'open-export') return $('#tripo-export-dialog').showModal();
      if (action === 'close-export') return $('#tripo-export-dialog').close();
      if (action === 'snapshot') return takeSnapshot();

      if (action === 'toggle-privacy') {
        settings.privacy = settings.privacy === 'public' ? 'private' : 'public';
        const privEl = $('#tripo-privacy-btn span');
        if (privEl) privEl.textContent = `🌐 ${settings.privacy === 'private' ? 'Private' : 'Public'}`;
        saveSettings();
        return;
      }

      if (action === 'upload-ref-btn' || action === 'upload-ref') {
        $('#tripo-ref-file-input')?.click();
        return;
      }

      if (action === 'clear-ref') {
        if (currentRefImageUrl && currentRefImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentRefImageUrl);
        }
        currentRefImageFile = null;
        currentRefImageUrl = '';
        multiViewFiles.delete('front');
        renderToolPanel();
        return;
      }

      if (action === 'upload-model-card') {
        $('#tripo-upload-model-input')?.click();
        return;
      }

      if (action === 'delete-asset') {
        const idx = Number(target.dataset.asset);
        if (assets[idx]) {
          modelPendingDelete = assets[idx];
          const name = modelPendingDelete.interpreted_as || 'this 3D model';
          $('#a3d-delete-msg').innerHTML = `Are you sure you want to permanently delete <strong>${esc(name)}</strong>?<br><span style="color:#a1a1aa;font-size:11px;margin-top:8px;display:inline-block">The GLB and associated textures will be removed from your disk.</span>`;
          $('#a3d-delete-dialog').showModal();
        }
        return;
      }

      if (action === 'cancel-delete') {
        modelPendingDelete = null;
        $('#a3d-delete-dialog').close();
        return;
      }

      if (action === 'confirm-delete') {
        if (modelPendingDelete) {
          const delId = modelPendingDelete.id;
          const delName = modelPendingDelete.interpreted_as || 'Model';
          try {
            await bridge.delete(delId);
            assets = assets.filter(a => a.id !== delId);
            if (state.model3dTask?.id === delId) {
              state.model3dTask = assets[0] || null;
            }
            renderAssets();
            renderStatus();
            $('#a3d-delete-dialog').close();
            state.model3dNotice = `Deleted "${delName}".`;
            renderStatus();
          } catch (err) {
            showError(err.message || 'Could not delete model.');
          } finally {
            modelPendingDelete = null;
          }
        }
        return;
      }

      if (action === 'generate') {
        try {
          const form = new FormData();

          if (selectedEngine === 'hunyuan-mv') {
            const mvLabels = ['front', 'left', 'back', 'right'].filter(v => multiViewFiles.has(v));
            if (!mvLabels.includes('front')) {
              throw new Error('Please upload at least a Front reference image for Hunyuan3D-2mv.');
            }
            if (mvLabels.length < 2) {
              throw new Error('Hunyuan3D-2mv requires at least two labeled angles (e.g. Front + Left/Back/Right).');
            }
            for (const view of mvLabels) {
              form.append('images', multiViewFiles.get(view).file);
            }
            form.append('views', JSON.stringify(mvLabels));
          } else {
            if (!currentRefImageFile && !state.model3dTask) {
              throw new Error('Please upload a reference image or select a model first.');
            }
            if (currentRefImageFile) {
              form.append('images', currentRefImageFile);
              form.append('views', JSON.stringify(['front']));
            }
          }

          // Engine mapping (fallbacks seamlessly if not installed locally)
          form.append('engine', selectedEngine || 'hunyuan-mini');
          form.append('detail', selectedEngine === 'hunyuan-mini' ? 'standard' : 'high');
          form.append('seed', '12345');
          form.append('remove_background', 'true');
          form.append('align', 'true');
          form.append('ultra_mesh_quality', String(settings.ultra));
          form.append('ai_complete', String(settings.aiComplete));
          form.append('texture', String(settings.texture));
          form.append('texture_quality', String(settings.textureQuality));
          form.append('remove_lighting', String(settings.removeLighting));
          form.append('pbr', String(settings.pbr));
          form.append('topology', String(settings.topology));
          form.append('polycount', String(settings.polycount));

          // Set immediate loading state
          state.model3dBusy = true;
          state.model3dNotice = 'Synthesizing 3D geometry with Hunyuan...';
          renderStatus();

          return bridge.generateImage(form);
        } catch (err) {
          showError(err.message || 'Could not start generation.');
        }
        return;
      }

      if (action === 'reset') {
        const viewer = $('#a3d-viewer');
        if (viewer) {
          viewer.cameraOrbit = '0deg 75deg auto';
          viewer.cameraTarget = 'auto auto auto';
          viewer.fieldOfView = 'auto';
        }
        return;
      }

      if (action === 'light') {
        const viewer = $('#a3d-viewer');
        if (viewer) {
          viewer.exposure = viewer.exposure > 1 ? 0.8 : 1.4;
        }
        return;
      }

      if (action === 'wireframe') {
        const viewer = $('#a3d-viewer');
        if (viewer) {
          viewer.shadowIntensity = viewer.shadowIntensity > 0.5 ? 0 : 1.5;
        }
        return;
      }

      if (action.startsWith('download-')) {
        const ext = action.slice(9);
        $('#tripo-export-dialog')?.close();
        return bridge.download(ext);
      }

      if (action === 'share') {
        if (currentUrl) {
          navigator.clipboard.writeText(window.location.href);
          alert('Model link copied to clipboard!');
        }
        return;
      }
    }

    // Asset card selection (Left click preview)
    const assetCard = e.target.closest('.tripo-asset-card');
    if (assetCard && !e.target.closest('[data-action="delete-asset"]') && !e.target.closest('[data-action="asset-info"]')) {
      const idx = Number(assetCard.dataset.asset);
      if (assets[idx]) {
        state.model3dTask = assets[idx];
        bridge.select(assets[idx]);
        renderAssets();
        renderStatus();
      }
      return;
    }
  }

  window.Aubit3DStudio = {
    open(data, callbacks) {
      state = data;
      bridge = callbacks;
      if (!root) mount();
      root.hidden = false;
      document.body.classList.add('a3d-open');
      loadSettings();
      loadLibrary();
      renderStatus();
      refreshTimer = setInterval(() => {
        if (!state.model3dBusy) bridge.reconnect();
      }, 30000);
    },
    close() {
      if (!root) return;
      root.hidden = true;
      clearInterval(refreshTimer);
      document.body.classList.remove('a3d-open');
    }
  };
})();

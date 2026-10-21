/* Aubit local 3D studio: real engine capabilities and non-destructive editing. */
(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const glyphs = {cube:'<path d="m12 3 9 5v9l-9 5-9-5V8Zm0 10 9-5M3 8l9 5v9"/>',image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4 18 6-6 4 4 3-3 4 5"/>',spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',parts:'<path d="m3 6 5-3 5 3-5 3Zm0 0v6l5 3V9m5-3v6l-5 3m8-2 5 3v6l-5 3-5-3v-6Zm0 6 5-3m-5 3-5-3m5 3v6"/>',uv:'<path d="M3 3h18v18H3Zm6 0v18m6-18v18M3 9h18M3 15h18"/>',layers:'<path d="m12 2 10 5-10 5-10-5Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',brush:'<path d="m8 15 11-12 3 3-12 11M8 15c-5-2-3 5-6 6 7 1 10-1 8-4Z"/>',arrow:'<path d="m9 5 7 7-7 7"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',down:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',rotate:'<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',check:'<path d="m4 12 5 5L20 6"/>'};
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name] || glyphs.cube}</svg>`;
  const stages = [ ['input','image','Input','Single or Multi-View Input'], ['geometry','cube','Geometry','High-Quality Geometry'], ['parts','parts','Parts','Part Refinement'], ['uv','uv','UV','Retopology + UV'], ['texture','brush','Texture','Anime Texture Studio'] ];
  const views = ['front','left','back','right'];
  const engineMeta = {
    'hunyuan-mini': { glyph: 'cube', subtitle: 'stability baseline', desc: 'Establish whether a lightweight engine consistently generates complete meshes on your machine. It isn\'t necessarily your final quality engine.' },
    'hunyuan-mv': { glyph: 'parts', subtitle: 'multi-view conditioning', desc: 'Native multi-view reconstruction from 2 to 4 labeled camera angles (Front, Left, Back, Right).' },
    'hunyuan-2.1': { glyph: 'spark', subtitle: 'higher-detail mode', desc: 'Keep this as a candidate once we\'ve verified that shape generation reliably works with offloading.' },
    'stable-fast-3d': { glyph: 'layers', subtitle: 'different reconstruction approach', desc: 'Generates UV-mapped textured assets, but its approximately 6 GB VRAM requirement is borderline and Windows support is experimental.' },
  };
  let root, bridge, state, stage='input', inputMode='single', engine='hunyuan-mini', assets=[], lastAsset='', currentUrl='', error='', previousFocus, refreshTimer;
  const files = new Map();
  const $ = s => root.querySelector(s);
  const button = (action, label, glyph='', extra='') => `<button type="button" data-action="${action}" ${extra}>${glyph?icon(glyph):''}${label}</button>`;

  function mount() {
    root = document.createElement('section'); root.className='a3d'; root.hidden=true;
    root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label','Aubit 3D studio');
    root.innerHTML = `
      <nav class="a3d-rail" aria-label="Model workflow">
        ${button('home','<span class="a3d-logo-mark">a</span>','','class="a3d-brand" title="Back to Aubit"')}
        <div class="a3d-nav">${stages.map(([id,glyph,label])=>button(`stage-${id}`,`<span>${label}</span>`,glyph,`data-stage="${id}"`)).join('')}</div>
        ${button('help','<span>Guide</span>','spark')}${button('home','<span>Exit</span>','close')}
      </nav>
      <aside class="a3d-controls">
        <header class="a3d-heading"><span class="a3d-eyebrow">AUBIT · LOCAL CREATION</span><h1 id="a3d-title">Generate Model</h1></header>
        <div class="a3d-scroll">
          <section data-panel="input">
            <div class="a3d-segment">${button('mode-single','Single view','','aria-pressed="true"')}${button('mode-multi','Multi-view','','aria-pressed="false"')}${button('mode-text','Text','','aria-pressed="false"')}</div>
            <div id="a3d-image-input">
              <div class="a3d-section-heading"><h2>Reference images</h2><span id="a3d-view-count">0 / 1</span></div>
              <p class="a3d-muted">Use the same object, pose and lighting. Label each camera angle.</p>
              <div class="a3d-views">${views.map((view,i)=>`<div class="a3d-view" data-view="${view}" ${i?'hidden':''}>
                <label class="a3d-drop"><input type="file" data-upload="${view}" accept="image/png,image/jpeg,image/webp"><img alt="${view} reference" hidden><span class="a3d-upload-icon">${icon('image')}</span><strong>${view[0].toUpperCase()+view.slice(1)}</strong><small>Click or drop image</small></label>
                <div class="a3d-view-actions">${button(`rotate-${view}`,icon('rotate'),'','title="Rotate 90 degrees"')}${button(`remove-${view}`,icon('close'),'','title="Remove image"')}</div></div>`).join('')}</div>
              <label class="a3d-batch">${icon('image')} Upload several angles<input id="a3d-batch-input" type="file" multiple accept="image/png,image/jpeg,image/webp"></label>
              <p class="a3d-tiny">PNG, JPG, WEBP · 10 MB per view<br>Multiple files fill Front → Left → Back → Right.</p>
              <div class="a3d-card"><h2>Clean & align</h2><label class="a3d-toggle"><span>Remove background</span><input id="a3d-remove-bg" type="checkbox" checked></label><label class="a3d-toggle"><span>Center object & match framing</span><input id="a3d-align" type="checkbox" checked></label><p class="a3d-tiny">Keeps each real angle. No mirrored or invented views.</p></div>
            </div>
            <div id="a3d-text-input" hidden><label for="a3d-prompt">Describe a model</label><textarea id="a3d-prompt" maxlength="800" rows="6" placeholder="A blue robot with a round head…"></textarea><p class="a3d-muted">Aubit's procedural text builder creates supported object shapes. Image engines reconstruct from your reference photos.</p></div>
            <div class="a3d-field" id="a3d-engine-field">
              <div class="a3d-section-heading"><span>Reconstruction engine</span><span class="a3d-muted" id="a3d-engine-view-hint">1 angle</span></div>
              <div id="a3d-engine-cards" class="a3d-engine-cards" role="radiogroup" aria-label="Reconstruction engine"></div>
              <select id="a3d-engine" hidden></select>
            </div>
            <div id="a3d-engine-status" class="a3d-engine-status"></div>
            ${button('reconnect','Refresh engine status','rotate','class="a3d-subtle"')}
            <label class="a3d-field">Geometry detail<select id="a3d-detail"><option value="standard">Balanced · 256 grid / 30 steps</option><option value="high">High · 384 grid / 50 steps</option><option value="low">Preview · 192 grid / 20 steps</option></select></label>
            <label class="a3d-field">Seed<input id="a3d-seed" type="number" min="0" max="2147483647" value="12345"></label>
            ${button('generate','Generate Model','spark','class="a3d-primary a3d-generate"')}
          </section>
          <section data-panel="geometry" hidden><div class="a3d-step-label">02 / INSPECT</div><h2>Keep the good geometry.</h2><p class="a3d-muted">Rotate every side and inspect thin surfaces, missing pieces and loose fragments before accepting.</p><div id="a3d-quality" class="a3d-card"></div>${button('inspect','Run geometry inspection','cube','class="a3d-wide"')}<div class="a3d-review">${button('accept','Accept mesh','check')}${button('reject','Reject mesh','close')}</div><p class="a3d-tiny">Rejection marks this asset in your library. It keeps the file for comparison.</p></section>
          <section data-panel="parts" hidden><div class="a3d-step-label">03 / REFINE</div><h2>Separate. Inspect. Repair.</h2><p class="a3d-muted">Separate connected components into named objects. Repair duplicate faces, normals and small holes without smoothing away edges.</p><label class="a3d-field">Connected part<select id="a3d-part"><option value="">All parts</option></select></label><label class="a3d-toggle"><span>Keep only largest component</span><input id="a3d-largest" type="checkbox"></label>${button('parts','Separate & repair parts','parts','class="a3d-primary a3d-wide"')}${button('repair','Repair selected geometry','check','class="a3d-wide"')}<p class="a3d-tiny">Parts are connected components, not semantic body-part detection. Every edit creates a new asset.</p></section>
          <section data-panel="uv" hidden><div class="a3d-step-label">04 / PREPARE</div><h2>Ready for texturing.</h2><p class="a3d-muted">Reduce triangle count with quadric simplification, then pack an xatlas UV layout.</p><label class="a3d-field">Target triangle count<input id="a3d-target" type="number" min="100" max="200000" value="20000" step="100"></label>${button('optimize','Optimize geometry + unwrap UV','uv','class="a3d-primary a3d-wide"')}<p class="a3d-tiny">Produces optimized triangles. The original detailed mesh stays in Assets. Existing textures should be reapplied after remeshing.</p></section>
          <section data-panel="texture" hidden><div class="a3d-step-label">05 / FINISH</div><h2>Anime Texture Studio</h2><p class="a3d-muted">Bake a palette or approximate reference colors into a UV texture, with stepped cel shading.</p><label class="a3d-field">Base color<input id="a3d-color" type="color" value="#75aaff"></label><label class="a3d-field">Cel shading bands<select id="a3d-bands"><option>2</option><option>3</option><option selected>4</option><option>6</option><option>8</option></select></label><label class="a3d-field">Texture size<select id="a3d-texture-size"><option>512</option><option selected>1024</option><option>2048</option></select></label><label class="a3d-toggle"><span>Project saved reference colors</span><input id="a3d-reference-colors" type="checkbox" checked></label>${button('texture','Bake anime texture','brush','class="a3d-primary a3d-wide"')}<p class="a3d-tiny">Cel lighting is baked into the exported texture. Hidden areas use the base color. Optimize complex meshes first for faster UV baking.</p></section>
        </div>
        <footer class="a3d-local"><i></i> Generated on your machine</footer>
      </aside>
      <main class="a3d-canvas">
        <header class="a3d-topbar"><span>${icon('cube')} AUBIT <b>3D STUDIO</b></span><span class="a3d-local-pill">LOCAL WORKSPACE</span></header>
        <div class="a3d-floor"></div>
        <div id="a3d-welcome" class="a3d-welcome"><div class="a3d-orbit"></div><div class="a3d-hero-cube">${icon('cube')}</div><span class="a3d-eyebrow">YOUR IDEAS, IN EVERY DIMENSION</span><h2>Build your next <em>3D world.</em></h2><p>Real references. Local generation. A finish that's yours.</p><div class="a3d-pipeline">${stages.map(([id,glyph,label],i)=>`${i?'<span class="a3d-flow-arrow">›</span>':''}${button(`stage-${id}`,label,glyph)}`).join('')}</div></div>
        <model-viewer id="a3d-viewer" hidden camera-controls touch-action="none" shadow-intensity="0.5" exposure="1" environment-image="neutral" interaction-prompt="none" alt="Generated 3D model"></model-viewer>
        <div class="a3d-view-tools">${button('reset','Reset view','rotate')}${button('spin','Orbit','cube')}${button('light','Lighting','spark')}</div>
        <div id="a3d-progress" class="a3d-progress" hidden><div><span class="a3d-spinner"></span><strong id="a3d-stage"></strong><span id="a3d-percent"></span></div><progress max="100" value="0"></progress></div>
        <div id="a3d-message" class="a3d-message" role="status" hidden></div>
        <footer class="a3d-canvas-footer"><span id="a3d-model-label">No model selected</span><span>Drag to orbit · Scroll to zoom</span></footer>
      </main>
      <aside class="a3d-assets"><header><h2>Assets <span id="a3d-asset-count">0</span></h2>${button('library','', 'rotate','title="Refresh assets"')}</header><div class="a3d-assets-summary"><span>Your local collection</span><strong>From reference to ready.</strong><small>Originals and refinements, together.</small></div><div id="a3d-assets-list" class="a3d-assets-list"></div><section class="a3d-export"><h2>Export selected</h2><div>${button('download-glb','GLB','down')}${button('download-stl','STL','down')}</div><p class="a3d-tiny">GLB includes materials and UV textures. STL contains geometry only.</p></section></aside>
      <dialog id="a3d-guide"><h2>Your local 3D workflow</h2><ol><li>Upload a clear front image, or 2–4 matching angles with Hunyuan3D-2mv.</li><li>Clean and center references, then generate with an installed engine.</li><li>Inspect all sides. Accept or reject the result.</li><li>Separate connected parts and repair small holes.</li><li>Optimize triangles and unwrap UVs before baking an anime texture.</li></ol><p>One photo cannot describe hidden surfaces accurately. Multiple angles help, but do not guarantee a perfect model.</p>${button('close-guide','Got it','','class="a3d-primary"')}</dialog>`;
    document.body.append(root);
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('dragover', event=>{if(event.target.closest('.a3d-drop')) event.preventDefault();});
    root.addEventListener('drop', event=>{ const target=event.target.closest('[data-view]'); if(target){event.preventDefault(); receive(target.dataset.view,event.dataTransfer.files[0]);} });
    $('#a3d-viewer').addEventListener('error',()=>showError('The 3D preview could not load. Try refreshing Assets or inspect the exported file.'));
    root.addEventListener('keydown', event=>{
      if(event.key==='Escape' && !$('#a3d-guide').open) bridge.close();
      if(event.key==='Tab' && !$('#a3d-guide').open){
        const controls=[...root.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
        if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1)?.focus();}
        else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0]?.focus();}
      }
    });
  }
  function showError(message){error=message;renderStatus();}
  function switchStage(id){stage=id;root.querySelectorAll('[data-panel]').forEach(el=>el.hidden=el.dataset.panel!==id);root.querySelectorAll('[data-stage]').forEach(el=>{el.classList.toggle('is-active',el.dataset.stage===id);el.setAttribute('aria-current',el.dataset.stage===id?'step':'false');});$('#a3d-title').textContent=stages.find(s=>s[0]===id)[3];}
  function switchMode(mode){inputMode=mode;root.querySelectorAll('[data-action^="mode-"]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.action===`mode-${mode}`)));$('#a3d-image-input').hidden=mode==='text';$('#a3d-text-input').hidden=mode!=='text';$('#a3d-engine-field').hidden=mode==='text';root.querySelectorAll('[data-view]').forEach(el=>el.hidden=mode!=='multi'&&el.dataset.view!=='front');if(mode==='multi')engine='hunyuan-mv';else if(engine==='hunyuan-mv')engine='hunyuan-mini';renderEngines();renderFiles();}
  async function receive(view,file){
    if(!file)return;
    if(file.size>10*1024*1024)return showError('Each image must be 10 MB or smaller.');
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))return showError('Choose PNG, JPG or WEBP images.');
    try { const bitmap=await createImageBitmap(file); if(bitmap.width*bitmap.height>16000000){bitmap.close();throw Error('Use an image under 16 megapixels.');} bitmap.close();
      const old=files.get(view);if(old)URL.revokeObjectURL(old.url);files.set(view,{file,url:URL.createObjectURL(file)});error='';renderFiles();renderStatus();
    } catch(e){showError(e.message||'Unable to read this image.');}
  }
  function renderFiles(){
    for(const view of views){const el=$(`[data-view="${view}"]`),ref=files.get(view);el.classList.toggle('has-image',!!ref);const img=el.querySelector('img');img.hidden=!ref;if(ref)img.src=ref.url;else img.removeAttribute('src');el.querySelector('small').textContent=ref?ref.file.name:'Click or drop image';}
    const count=inputMode==='multi'?files.size:Number(files.has('front'));$('#a3d-view-count').textContent=`${count} / ${inputMode==='multi'?4:1}`;
  }
  function renderEngines(){
    const engines=Array.isArray(state.image3dEngines)?state.image3dEngines:[];
    const select=$('#a3d-engine');
    const selectHtml=engines.map(e=>`<option value="${esc(e.id)}" ${inputMode==='multi'&&e.views.length===1?'disabled':''}>${esc(e.name)}${e.available?'':' · setup needed'}</option>`).join('');
    if(select.innerHTML!==selectHtml)select.innerHTML=selectHtml;
    select.value=engine;

    const cardsEl=$('#a3d-engine-cards');
    if(cardsEl){
      cardsEl.innerHTML=engines.map(e=>{
        const meta=engineMeta[e.id]||{glyph:'cube',subtitle:e.family||'engine',desc:e.description||''};
        const isMultiDisabled=inputMode==='multi'&&e.views.length===1;
        const isActive=e.id===engine;
        return `<div class="a3d-engine-card ${isActive?'is-active':''} ${isMultiDisabled?'is-disabled':''}" data-engine-card="${esc(e.id)}" tabindex="0" role="radio" aria-checked="${isActive}">
          <span class="a3d-engine-card-icon">${icon(meta.glyph)}</span>
          <div class="a3d-engine-card-body">
            <div class="a3d-engine-card-header">
              <span class="a3d-engine-card-title">${esc(e.name)} <span class="a3d-engine-card-subtitle">— ${esc(meta.subtitle)}</span></span>
              <span class="a3d-engine-card-pill ${e.available?'ready':''}">${isMultiDisabled?'Single view only':e.available?'Ready':'Setup needed'}</span>
            </div>
            <p class="a3d-engine-card-desc">${esc(meta.desc)}</p>
          </div>
        </div>`;
      }).join('');
    }

    const hintEl=$('#a3d-engine-view-hint');
    if(hintEl)hintEl.textContent=inputMode==='multi'?'2–4 camera angles required':'Single camera angle';

    const spec=engines.find(e=>e.id===engine);
    $('#a3d-engine-status').innerHTML=inputMode==='text'?'':spec?`<span class="a3d-status-dot ${spec.available?'ready':''}"></span><strong>${esc(spec.message)}</strong><p>${esc(spec.description)}</p>${!spec.available?`<details><summary>Installation command</summary><code>${esc(spec.setup_command)}</code></details>`:''}`:'Checking local engine status…';
    $('[data-action="generate"]').disabled=!!state.model3dBusy||(inputMode!=='text'&&!spec?.available);
  }
  async function loadLibrary(){
    try{const data=await bridge.library();assets=data.models||[];renderAssets();}catch(e){showError(e.message);}
  }
  function renderAssets(){
    $('#a3d-asset-count').textContent=assets.length;
    $('#a3d-assets-list').innerHTML=assets.length?assets.map((asset,i)=>{
      const url=bridge.url(asset.model_urls?.glb,'glb');
      return `<button class="a3d-asset ${state.model3dTask?.id===asset.id?'selected':''}" data-asset="${i}">${url?`<model-viewer src="${esc(url)}" loading="lazy" reveal="auto" interaction-prompt="none" alt="${esc(asset.interpreted_as)}"></model-viewer>`:icon('cube')}<span class="a3d-asset-name">${esc(asset.interpreted_as||'Local model')}</span><small class="${['invalid','rejected'].includes(asset.quality_status)?'a3d-bad':''}">${esc(asset.quality_status==='invalid'?'Needs regeneration':asset.quality_status||'Unreviewed')} · ${Number(asset.triangle_count||0).toLocaleString()} tris</small></button>`;
    }).join(''):'<p class="a3d-empty">Your generated models<br>will appear here.</p>';
  }
  function renderQuality(){
    const task=state.model3dTask,q=task?.quality;
    $('#a3d-quality').innerHTML=q?`<span class="a3d-eyebrow">GEOMETRY REPORT</span><dl><dt>Triangles</dt><dd>${Number(q.triangle_count).toLocaleString()}</dd><dt>Connected parts</dt><dd>${q.components}</dd><dt>Closed surface</dt><dd>${q.watertight?'Yes':'No'}</dd><dt>Open edges</dt><dd>${q.boundary_edges}</dd><dt>Non-manifold edges</dt><dd>${q.nonmanifold_edges}</dd></dl>${q.warnings.map(w=>`<p class="a3d-warning">${esc(w)}</p>`).join('')}<strong>Review: ${esc(task.quality_status||'pending')}</strong>`:'<p class="a3d-muted">Select a completed model and run inspection to check its geometry.</p>';
    const select=$('#a3d-part'), previous=select.value;
    const html='<option value="">All parts</option>'+(q?.parts||[]).map(p=>`<option value="${p.index}">Part ${p.index+1} · ${p.triangles.toLocaleString()} triangles</option>`).join('');
    if(select.innerHTML!==html){select.innerHTML=html;select.value=previous;}
    for(const action of ['inspect','accept','reject','parts','repair','optimize','texture','download-glb','download-stl']){
      const invalid=['invalid','rejected'].includes(task?.quality_status);
      $(`[data-action="${action}"]`).disabled=!!state.model3dBusy||task?.status!=='SUCCEEDED'||(invalid&&!['reject','inspect','accept','download-glb','download-stl'].includes(action));
    }
  }
  function renderStatus(){
    const task=state.model3dTask;
    const message=error||state.model3dError||state.model3dNotice||'';
    $('#a3d-message').textContent=message;$('#a3d-message').hidden=!message;$('#a3d-message').classList.toggle('is-error',!!(error||state.model3dError));
    $('#a3d-progress').hidden=!state.model3dBusy;$('#a3d-stage').textContent=task?.stage||'Preparing local job';$('#a3d-percent').textContent=`${task?.progress||0}%`;$('progress').value=task?.progress||0;
    const url=task?.status==='SUCCEEDED'?bridge.url(task.model_urls?.glb,'glb'):'';
    if(url!==currentUrl){currentUrl=url;const viewer=$('#a3d-viewer');if(url)viewer.src=url;else viewer.removeAttribute('src');viewer.hidden=!url;$('#a3d-welcome').hidden=!!url;}
    $('#a3d-model-label').textContent=task?.status==='SUCCEEDED'?`${task.interpreted_as||'Model'} · ${Number(task.triangle_count||0).toLocaleString()} triangles`:'No model selected';
    renderEngines();renderQuality();
    if(task?.status==='SUCCEEDED'&&lastAsset!==`${task.id}:${task.quality_status}`){lastAsset=`${task.id}:${task.quality_status}`;loadLibrary();}
  }
  async function onChange(event){
    const el=event.target;
    if(el.dataset.upload){await receive(el.dataset.upload,el.files[0]);el.value='';}
    if(el.id==='a3d-batch-input'){
      const batch=[...el.files];if(batch.length>4){showError('Choose at most four reference angles.');el.value='';return;}
      if(batch.length>1)switchMode('multi');for(let i=0;i<batch.length;i++)await receive(views[i],batch[i]);el.value='';
    }
    if(el.id==='a3d-engine'){engine=el.value;if(engine==='hunyuan-mv'&&inputMode!=='multi')switchMode('multi');renderEngines();}
    if(el.id==='a3d-prompt')bridge.prompt(el.value);
  }
  async function onClick(event){
    const engineCard=event.target.closest('[data-engine-card]');
    if(engineCard && !engineCard.classList.contains('is-disabled')){
      engine=engineCard.dataset.engineCard;
      if(engine==='hunyuan-mv'&&inputMode!=='multi') switchMode('multi');
      renderEngines();
      return;
    }
    const assetButton=event.target.closest('[data-asset]');if(assetButton){bridge.select(assets[Number(assetButton.dataset.asset)]);renderAssets();return;}
    const target=event.target.closest('[data-action]');if(!target||target.disabled)return;
    const action=target.dataset.action;error='';
    try{
      if(action.startsWith('stage-'))return switchStage(action.slice(6));
      if(action.startsWith('mode-'))return switchMode(action.slice(5));
      if(action==='home')return bridge.close();
      if(action==='help')return $('#a3d-guide').showModal();
      if(action==='close-guide')return $('#a3d-guide').close();
      if(action==='library')return loadLibrary();
      if(action==='reconnect')return await bridge.reconnect();
      if(action.startsWith('remove-')){const view=action.slice(7),ref=files.get(view);if(ref)URL.revokeObjectURL(ref.url);files.delete(view);return renderFiles();}
      if(action.startsWith('rotate-')){const view=action.slice(7),ref=files.get(view);if(!ref)return;const bitmap=await createImageBitmap(ref.file),canvas=document.createElement('canvas');canvas.width=bitmap.height;canvas.height=bitmap.width;const ctx=canvas.getContext('2d');ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(Math.PI/2);ctx.drawImage(bitmap,-bitmap.width/2,-bitmap.height/2);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));return receive(view,new File([blob],ref.file.name.replace(/\.[^.]+$/,'.png'),{type:'image/png'}));}
      if(action==='generate'){
        if(inputMode==='text')return bridge.generate($('#a3d-prompt').value);
        const labels=views.filter(v=>files.has(v)&&(inputMode==='multi'||v==='front'));
        if(!labels.includes('front'))throw Error('Upload a front reference first.');
        if(inputMode==='multi'&&labels.length<2)throw Error('Upload at least two different angles for multi-view reconstruction.');
        const seed=Number($('#a3d-seed').value);if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw Error('Enter a seed between 0 and 2147483647.');
        const form=new FormData();for(const view of labels)form.append('images',files.get(view).file);form.append('views',JSON.stringify(labels));form.append('engine',engine);form.append('detail',$('#a3d-detail').value);form.append('seed',String(seed));form.append('remove_background',String($('#a3d-remove-bg').checked));form.append('align',String($('#a3d-align').checked));return bridge.generateImage(form);
      }
      if(['inspect','repair','parts','optimize','texture'].includes(action)){
        const count=Number($('#a3d-target').value);if(!Number.isInteger(count)||count<100||count>200000)throw Error('Target triangles must be between 100 and 200,000.');
        return bridge.edit(state.model3dTask.id,{operation:action,target_faces:count,part:$('#a3d-part').value===''?null:Number($('#a3d-part').value),keep_largest:$('#a3d-largest').checked,color:$('#a3d-color').value,bands:Number($('#a3d-bands').value),use_references:$('#a3d-reference-colors').checked,texture_size:Number($('#a3d-texture-size').value)});
      }
      if(action==='accept'||action==='reject'){const updated=await bridge.imageRequest('POST',`/${state.model3dTask.id}/review`,{decision:action==='accept'?'accepted':'rejected'});bridge.select(updated);return;}
      if(action.startsWith('download-'))return bridge.download(action.slice(9));
      const viewer=$('#a3d-viewer');
      if(action==='reset'){viewer.cameraOrbit='0deg 75deg auto';viewer.cameraTarget='auto auto auto';viewer.fieldOfView='auto';}
      if(action==='spin'){viewer.autoRotate=!viewer.autoRotate;target.classList.toggle('is-active',viewer.autoRotate);}
      if(action==='light')viewer.exposure=viewer.exposure>1?0.8:1.5;
    }catch(e){showError(e.message||'This action could not finish.');}
  }
  window.Aubit3DStudio={
    open(data,callbacks){state=data;bridge=callbacks;if(!root)mount();const opening=root.hidden;root.hidden=false;document.body.classList.add('a3d-open');if(opening){previousFocus=document.activeElement;switchStage(stage);switchMode(inputMode);loadLibrary();$('[data-action="home"]').focus();refreshTimer=setInterval(()=>{if(!state.model3dBusy)bridge.reconnect();},30000);}renderStatus();},
    close(){if(!root)return;root.hidden=true;clearInterval(refreshTimer);document.body.classList.remove('a3d-open');previousFocus?.focus();}
  };
})();

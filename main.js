function initPage(images) {
  function sampleColors(img) {
    const offscreen = document.createElement('canvas');
    offscreen.width = 10;
    offscreen.height = 10;
    const octx = offscreen.getContext('2d');
    octx.drawImage(img, 0, 0, 10, 10);
    const data = octx.getImageData(0, 0, 10, 10).data;
    const positions = [10, 50, 90];
    return positions.map(pct => {
      const idx = Math.floor(pct / 100 * 99) * 4;
      return { r: data[idx], g: data[idx+1], b: data[idx+2] };
    });
  }

  function startAnimation(points) {
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const RES = 200;
    canvas.width = RES;
    canvas.height = RES;
    const velocity = points.map(() => ({
      vx: ((Math.random() * 0.003) + 0.001) * (Math.random() < 0.5 ? 1 : -1),
      vy: ((Math.random() * 0.003) + 0.001) * (Math.random() < 0.5 ? 1 : -1)
    }));
    function draw() {
      for (let i = 0; i < points.length; i++) {
        points[i].x += velocity[i].vx;
        points[i].y += velocity[i].vy;
        if (points[i].x <= 0) { points[i].x = 0; velocity[i].vx = Math.abs(velocity[i].vx); }
        if (points[i].x >= 1) { points[i].x = 1; velocity[i].vx = -Math.abs(velocity[i].vx); }
        if (points[i].y <= 0) { points[i].y = 0; velocity[i].vy = Math.abs(velocity[i].vy); }
        if (points[i].y >= 1) { points[i].y = 1; velocity[i].vy = -Math.abs(velocity[i].vy); }
      }
      const img = ctx.createImageData(RES, RES);
      const d = img.data;
      for (let y = 0; y < RES; y++) {
        for (let x = 0; x < RES; x++) {
          const nx = x / RES;
          const ny = y / RES;
          let totalW = 0;
          let r = 0, g = 0, b = 0;
          for (const p of points) {
            const dx = nx - p.x;
            const dy = ny - p.y;
            const w = 1 / (dx * dx + dy * dy + 0.0001);
            totalW += w;
            r += p.r * w;
            g += p.g * w;
            b += p.b * w;
          }
          const idx = (y * RES + x) * 4;
          d[idx]     = r / totalW;
          d[idx + 1] = g / totalW;
          d[idx + 2] = b / totalW;
          d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      requestAnimationFrame(draw);
    }
    draw();
  }

  async function loadMeta(filename) {
    try {
      const meta = await exifr.parse(filename, { xmp: true, iptc: true, exif: false });
      if (!meta) return;
      document.getElementById('meta-title').textContent =
        meta.Title || meta.ObjectName || '';
      document.getElementById('meta-description').textContent =
        meta.Description || meta.ImageDescription || '';
      const date = meta.DateCreated;
      if (date) {
        let display = String(date);
        if (display.length === 8 && !display.includes(':')) {
          display = `${display.slice(6)} / ${display.slice(4,6)} / ${display.slice(0,4)}`;
        } else if (display.includes(':')) {
          const parts = display.split(':');
          if (parts.length === 3) {
            display = `${parts[2]} / ${parts[1]} / ${parts[0]}`;
          }
        } else {
          const d = new Date(date);
          if (!isNaN(d)) display = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        document.getElementById('meta-date').textContent = display;
      }
      document.getElementById('meta-creator').textContent =
        meta.Creator || meta.Artist || '';
      document.getElementById('meta-jobtitle').textContent =
        meta.AuthorsPosition || '';
    } catch(e) {
      console.log('metadata fout', e);
    }
  }

  function contrastColor(r, g, b) {
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
  }

  const artwork = document.getElementById('artwork');
  const panel = document.getElementById('panel');
  const menu = document.getElementById('menu');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnMenu = document.getElementById('btn-menu');

  artwork.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    document.getElementById('nav').style.visibility = isOpen ? 'hidden' : 'visible';
  });

  panel.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.remove('open');
    document.getElementById('nav').style.visibility = 'visible';
  });

  btnRefresh.addEventListener('click', () => {
    window.location.reload();
  });

  btnMenu.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btnRefresh.disabled = isOpen;
    btnMenu.textContent = isOpen ? 'STAY' : 'MENU';
  });

  const bioTrigger = document.getElementById('bio-trigger');
const bioPanel = document.getElementById('bio-panel');

bioTrigger.addEventListener('click', () => {
  bioPanel.classList.toggle('open');
});

bioPanel.addEventListener('click', (e) => {
  if (!e.target.closest('a')) {
    bioPanel.classList.remove('open');
  }
});

  const lastImage = sessionStorage.getItem('lastImage');
  const available = lastImage
    ? images.filter(i => i !== lastImage)
    : images;
  const randomImage = available[Math.floor(Math.random() * available.length)];
  sessionStorage.setItem('lastImage', randomImage);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    const colors = sampleColors(img);
    const points = colors.map(c => ({
      x: Math.random(),
      y: Math.random(),
      r: c.r,
      g: c.g,
      b: c.b
    }));

    document.getElementById('btn-refresh').style.background =
      `rgb(${points[0].r}, ${points[0].g}, ${points[0].b})`;
    document.getElementById('btn-menu').style.background =
      `rgb(${points[1].r}, ${points[1].g}, ${points[1].b})`;
    document.getElementById('btn-refresh').style.color =
      contrastColor(points[0].r, points[0].g, points[0].b);
    document.getElementById('btn-menu').style.color =
      contrastColor(points[1].r, points[1].g, points[1].b);

    startAnimation(points);
    artwork.src = randomImage;
    loadMeta(randomImage);
    setTimeout(() => {
      const rect = artwork.getBoundingClientRect();
      const bottomOfPhoto = rect.bottom;
      const bottomOfScreen = window.innerHeight;
      const middle = bottomOfPhoto + (bottomOfScreen - bottomOfPhoto) / 2;
      const nav = document.getElementById('nav');
      nav.style.top = middle + 'px';
      nav.style.transform = 'translate(-50%, -50%)';
      nav.style.opacity = '1';
    }, 200);
  };
  img.src = randomImage;
}

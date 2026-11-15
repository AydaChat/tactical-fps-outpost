'use client';

import * as THREE from 'three';

// Cache generated textures so they are created once
let cachedGridTexture: THREE.CanvasTexture | null = null;
let cachedHazardTexture: THREE.CanvasTexture | null = null;
let cachedMetalTexture: THREE.CanvasTexture | null = null;
let cachedConcreteTexture: THREE.CanvasTexture | null = null;
let cachedHexTexture: THREE.CanvasTexture | null = null;
let cachedDecalTexture: THREE.CanvasTexture | null = null;

export function getGridTexture(): THREE.CanvasTexture {
  if (cachedGridTexture) return cachedGridTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base dark industrial slate
    ctx.fillStyle = '#11151f';
    ctx.fillRect(0, 0, 512, 512);

    // Grid panels
    const tileSize = 64;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        // Inner tile fill
        ctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? '#141a27' : '#121722';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Border groove
        ctx.strokeStyle = '#0b0e16';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Highlight seam
        ctx.strokeStyle = '#222d42';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + tileSize - 3);
        ctx.lineTo(x + tileSize - 3, y + tileSize - 3);
        ctx.lineTo(x + tileSize - 3, y + 3);
        ctx.stroke();

        // Corner rivets
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 6, y + 6, 2, 2);
        ctx.fillRect(x + tileSize - 8, y + 6, 2, 2);
        ctx.fillRect(x + 6, y + tileSize - 8, 2, 2);
        ctx.fillRect(x + tileSize - 8, y + tileSize - 8, 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  cachedGridTexture = texture;
  return texture;
}

export function getHazardTexture(): THREE.CanvasTexture {
  if (cachedHazardTexture) return cachedHazardTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Safety orange / amber and carbon black stripes
    ctx.fillStyle = '#d97706'; // Intense amber
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#131418'; // Dark charcoal
    ctx.beginPath();
    const stripeWidth = 32;
    for (let i = -256; i < 512; i += stripeWidth * 2) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + stripeWidth, 0);
      ctx.lineTo(i + stripeWidth + 256, 256);
      ctx.lineTo(i + 256, 256);
      ctx.closePath();
    }
    ctx.fill();

    // Weathering scratches
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let j = 0; j < 40; j++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      ctx.fillRect(rx, ry, Math.random() * 20 + 5, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedHazardTexture = texture;
  return texture;
}

export function getMetalPlateTexture(): THREE.CanvasTexture {
  if (cachedMetalTexture) return cachedMetalTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Dark gunmetal base
    ctx.fillStyle = '#181e2b';
    ctx.fillRect(0, 0, 512, 512);

    // Large reinforced armor slabs
    const slabW = 256;
    const slabH = 128;
    for (let y = 0; y < 512; y += slabH) {
      for (let x = 0; x < 512; x += slabW) {
        ctx.fillStyle = (x + y) % (slabW * 2) === 0 ? '#1b2230' : '#161c28';
        ctx.fillRect(x + 3, y + 3, slabW - 6, slabH - 6);

        // Seam shadow
        ctx.strokeStyle = '#0d111a';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1, y + 1, slabW - 2, slabH - 2);

        // Emissive-like specular chamfer
        ctx.strokeStyle = '#2d3b55';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, slabW - 8, slabH - 8);

        // Heavy bolts
        ctx.fillStyle = '#475569';
        [x + 12, x + slabW - 12].forEach((bx) => {
          [y + 12, y + slabH - 12].forEach((by) => {
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fill();
          });
        });
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedMetalTexture = texture;
  return texture;
}

export function getConcreteTexture(): THREE.CanvasTexture {
  if (cachedConcreteTexture) return cachedConcreteTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Brutalist concrete raw tone
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 512, 512);

    // Speckle noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(Math.random() * 30 + 20);
      ctx.fillStyle = `rgb(${gray}, ${gray + 3}, ${gray + 8})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Concrete formwork tie holes
    ctx.fillStyle = '#0f131a';
    for (let y = 64; y < 512; y += 128) {
      for (let x = 64; x < 512; x += 128) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a3445';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedConcreteTexture = texture;
  return texture;
}

export function getHexGridTexture(): THREE.CanvasTexture {
  if (cachedHexTexture) return cachedHexTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#081018';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.5;

    const hexR = 24;
    const h = hexR * Math.sqrt(3);
    for (let y = 0; y < 256 + h; y += h) {
      for (let x = 0; x < 256 + hexR * 3; x += hexR * 3) {
        drawHex(ctx, x, y, hexR);
        drawHex(ctx, x + hexR * 1.5, y + h / 2, hexR);
      }
    }
  }

  function drawHex(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = cx + r * Math.cos(angle);
      const hy = cy + r * Math.sin(angle);
      if (i === 0) c.moveTo(hx, hy);
      else c.lineTo(hx, hy);
    }
    c.closePath();
    c.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedHexTexture = texture;
  return texture;
}

export function getDecalTexture(label: string = 'OUTPOST-09'): THREE.CanvasTexture {
  if (cachedDecalTexture) return cachedDecalTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#111722';
    ctx.fillRect(0, 0, 512, 256);

    // Accent line
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(20, 20, 8, 216);

    // Military stencil header
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 48px monospace';
    ctx.fillText(label, 40, 75);

    // Subtext
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px monospace';
    ctx.fillText('TACTICAL SECTOR // RESTRICTED ACCESS', 40, 115);
    ctx.fillText('GRID REF: 52.88.941 // DEFCON 1', 40, 145);

    // Barcode design
    ctx.fillStyle = '#38bdf8';
    for (let x = 40; x < 400; x += Math.random() * 8 + 4) {
      ctx.fillRect(x, 175, Math.random() * 4 + 2, 45);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  cachedDecalTexture = texture;
  return texture;
}

import * as THREE from 'three';

/**
 * Procedural texture generator for HabitFlow — The Living Sanctuary.
 * 100% canvas-generated, zero external network assets or 404 risks.
 */

export function createMossTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base lush forest moss tone
  ctx.fillStyle = '#224a24';
  ctx.fillRect(0, 0, 512, 512);

  // Soft organic moss hummocks with radial gradients
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rad = 25 + Math.random() * 65;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const hues = [
      'rgba(45, 102, 44, 0.7)',
      'rgba(60, 132, 54, 0.55)',
      'rgba(24, 56, 26, 0.75)',
      'rgba(82, 158, 72, 0.45)',
      'rgba(38, 86, 40, 0.65)',
    ];
    grad.addColorStop(0, hues[Math.floor(Math.random() * hues.length)]);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Micro organic moss clumps & forest floor speckles
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1 + Math.random() * 3.2;
    const colors = ['#285427', '#3c7a38', '#1a3b1c', '#4b9444', '#173019', '#5da556'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle golden lichen dots
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(165, 205, 120, 0.55)' : 'rgba(195, 230, 150, 0.45)';
    ctx.fillRect(x, y, 2.5, 2.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMossBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  // Soft organic micro-height noise for velvety moss
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1 + Math.random() * 3.0;
    const shade = Math.floor(105 + Math.random() * 45);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function createEarthPathTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#54463a';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rad = 25 + Math.random() * 60;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, Math.random() > 0.5 ? 'rgba(110, 92, 75, 0.6)' : 'rgba(65, 52, 42, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.8 + Math.random() * 3.2;
    const colors = ['#695748', '#42372e', '#7b6756', '#8a7461', '#352c25'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRockBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 150; i++) {
    const y = Math.random() * 512;
    const height = 4 + Math.random() * 16;
    const shade = Math.floor(Math.random() * 180 + 30);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 512, height);
  }

  ctx.lineWidth = 2;
  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = Math.random() > 0.5 ? '#111' : '#ddd';
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      x += (Math.random() - 0.5) * 80;
      y += (Math.random() - 0.5) * 80;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

export function createHaloTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  // Ethereal circular nebula gradient matching reference artwork
  const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 250);
  grad.addColorStop(0, 'rgba(195, 165, 255, 0.5)');
  grad.addColorStop(0.3, 'rgba(155, 115, 250, 0.38)');
  grad.addColorStop(0.6, 'rgba(100, 145, 255, 0.2)');
  grad.addColorStop(0.85, 'rgba(60, 220, 240, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let a = 0; a < Math.PI * 4; a += 0.05) {
    const r = 50 + a * 30;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    ctx.fillStyle = `rgba(215, 195, 255, ${0.08 * (1 - a / (Math.PI * 4))})`;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSparkleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  rad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  rad.addColorStop(0.2, 'rgba(170, 235, 255, 0.9)');
  rad.addColorStop(0.6, 'rgba(150, 110, 255, 0.35)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

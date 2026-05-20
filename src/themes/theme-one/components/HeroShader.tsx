"use client";

import { useEffect, useRef } from "react";

/** Vanilla WebGL hero backdrop — flowing red noise field with subtle
 * mouse parallax. Zero npm dependencies (no three.js / r3f / ogl);
 * the entire shader + JS is ~4 KB minified. Lazy-mounted via
 * next/dynamic from HeroSection ONLY on desktop (md+) and only when
 * prefers-reduced-motion is off — the caller is responsible for that
 * gating. On mobile the static CSS mesh blobs render instead, so the
 * mobile budget pays nothing for this. */
export default function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return; // No WebGL — silently no-op, CSS mesh underneath still paints.

    // Vertex: trivial full-screen triangle pair.
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment: three layers of value-noise drifting on different
    // axes + a soft radial vignette + a red→dark-red gradient base.
    // mediump everywhere — fine for the 60 fps drift, saves mobile
    // GPUs hassle (not that we ship this to mobile).
    const fs = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform vec2 u_mouse;
      varying vec2 v_uv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = v_uv;
        vec2 mouseOff = (u_mouse / u_res - 0.5) * 0.25;

        float t = u_time * 0.035;
        float n1 = noise(uv * 2.4 + vec2(t,        t * 0.6) + mouseOff);
        float n2 = noise(uv * 5.0 + vec2(-t * 0.7, t * 1.1));
        float n3 = noise(uv * 1.5 + vec2(t * 0.4,  -t * 0.5));
        float n = n1 * 0.55 + n2 * 0.25 + n3 * 0.20;

        // Red gradient base — bright red top-right, dark red bottom-left.
        vec3 red    = vec3(0.86, 0.15, 0.15);   // ~#DC2626
        vec3 darker = vec3(0.42, 0.06, 0.06);   // ~#6B0F0F
        vec3 ink    = vec3(0.03, 0.03, 0.04);   // near-black

        vec3 col = mix(darker, red, smoothstep(0.25, 0.85, n));
        col = mix(col, ink, smoothstep(0.55, 1.0, 1.0 - n) * 0.55);

        // Soft radial vignette, brighter toward upper-right where the
        // mouse parallax lifts the lightness.
        float vig = smoothstep(1.1, 0.25, length(uv - vec2(0.7, 0.4) - mouseOff));
        col *= 0.55 + 0.45 * vig;

        // Fade the top edge to near-white so the backdrop blends into
        // the headline area; fade the bottom to white so the section
        // below the hero gets a clean handoff.
        float topFade = smoothstep(0.0, 0.18, uv.y);
        float botFade = smoothstep(1.0, 0.78, uv.y);
        col = mix(vec3(1.0), col, topFade * botFade);

        // Alpha so the white page peeks through subtly — feels like
        // ambient lighting on the canvas rather than a hard layer.
        gl_FragColor = vec4(col, 0.55 * topFade * botFade);
      }
    `;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        // Quiet failure — log once, fall back to no-render.
        console.warn("HeroShader compile error:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vert = compile(gl.VERTEX_SHADER, vs);
    const frag = compile(gl.FRAGMENT_SHADER, fs);
    if (!vert || !frag) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("HeroShader link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Full-screen quad (two triangles, four verts).
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const a_position = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    const u_time = gl.getUniformLocation(prog, "u_time");
    const u_res = gl.getUniformLocation(prog, "u_res");
    const u_mouse = gl.getUniformLocation(prog, "u_mouse");

    // DPR-aware resize — cap at 1.5 so 3x retina screens don't melt.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * Math.min(window.devicePixelRatio || 1, 1.5);
      mouseY = (e.clientY - rect.top) * Math.min(window.devicePixelRatio || 1, 1.5);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let running = true;
    let visible = true;
    const onVisibility = () => { visible = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      if (!running) return;
      if (visible) {
        resize();
        const t = (performance.now() - start) / 1000;
        gl.uniform1f(u_time, t);
        gl.uniform2f(u_res, canvas.width, canvas.height);
        gl.uniform2f(u_mouse, mouseX, mouseY);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

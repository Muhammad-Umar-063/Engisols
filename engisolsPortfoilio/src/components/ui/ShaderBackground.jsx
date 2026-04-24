import { useEffect, useRef } from 'react'

const vsSource = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`

// Shader adapted to Engisols crimson/maroon brand palette
const fsSource = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;

  const float overallSpeed     = 0.18;
  const float gridSmoothWidth  = 0.015;
  const float axisWidth        = 0.05;
  const float majorLineWidth   = 0.025;
  const float minorLineWidth   = 0.0125;
  const float majorLineFrequency = 5.0;
  const float minorLineFrequency = 1.0;
  const float scale            = 5.0;
  const vec4  lineColor        = vec4(0.87, 0.24, 0.37, 1.0); /* #dd3e5e crimson */
  const float minLineWidth     = 0.01;
  const float maxLineWidth     = 0.18;
  const float lineSpeed        = 1.0 * overallSpeed;
  const float lineAmplitude    = 1.0;
  const float lineFrequency    = 0.2;
  const float warpSpeed        = 0.2 * overallSpeed;
  const float warpFrequency    = 0.5;
  const float warpAmplitude    = 1.0;
  const float offsetFrequency  = 0.5;
  const float offsetSpeed      = 1.33 * overallSpeed;
  const float minOffsetSpread  = 0.6;
  const float maxOffsetSpread  = 2.0;
  const int   linesPerGroup    = 16;

  #define drawCircle(pos,radius,coord)     smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
  #define drawSmoothLine(pos,halfWidth,t)  smoothstep(halfWidth, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos,halfWidth,t)   smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float hFade, float offset) {
    return random(x * lineFrequency + iTime * lineSpeed) * hFade * lineAmplitude + offset;
  }

  void main() {
    vec2 uv    = gl_FragCoord.xy / iResolution.xy;
    vec2 space = (gl_FragCoord.xy - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

    float hFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float vFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + hFade);
    space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * hFade;

    /* dark crimson gradient background — matches --chicago / --maroon palette */
    vec4 bgColor1 = vec4(0.055, 0.035, 0.035, 1.0); /* near-black with red tint */
    vec4 bgColor2 = vec4(0.22,  0.07,  0.10,  1.0); /* #381218 dark maroon     */

    vec4 lines = vec4(0.0);

    for (int l = 0; l < linesPerGroup; l++) {
      float nli            = float(l) / float(linesPerGroup);
      float offsetTime     = iTime * offsetSpeed;
      float offsetPosition = float(l) + space.x * offsetFrequency;
      float rand           = random(offsetPosition + offsetTime) * 0.5 + 0.5;
      float halfWidth      = mix(minLineWidth, maxLineWidth, rand * hFade) / 2.0;
      float offset         = random(offsetPosition + offsetTime * (1.0 + nli)) * mix(minOffsetSpread, maxOffsetSpread, hFade);
      float linePos        = getPlasmaY(space.x, hFade, offset);
      float line           = drawSmoothLine(linePos, halfWidth, space.y) / 2.0
                           + drawCrispLine(linePos, halfWidth * 0.15, space.y);

      float cx = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
      vec2  cp = vec2(cx, getPlasmaY(cx, hFade, offset));
      float circle = drawCircle(cp, 0.01, space) * 4.0;

      lines += (line + circle) * lineColor * rand;
    }

    vec4 color  = mix(bgColor1, bgColor2, uv.x);
    color      *= vFade;
    color.a     = 1.0;
    color      += lines;

    gl_FragColor = color;
  }
`

function loadShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function initShaderProgram(gl) {
  const vs = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fs = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Shader link error:', gl.getProgramInfoLog(prog))
    return null
  }
  return prog
}

export default function ShaderBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) return

    const program = initShaderProgram(gl)
    if (!program) return

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    const info = {
      program,
      attrib:  gl.getAttribLocation(program, 'aVertexPosition'),
      uRes:    gl.getUniformLocation(program, 'iResolution'),
      uTime:   gl.getUniformLocation(program, 'iTime'),
    }

    const resize = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width  = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    resize()

    let raf
    let visible = false
    const t0 = Date.now()

    const render = () => {
      if (visible) {
        const t = (Date.now() - t0) / 1000
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(info.program)
        gl.uniform2f(info.uRes, canvas.width, canvas.height)
        gl.uniform1f(info.uTime, t)
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.vertexAttribPointer(info.attrib, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(info.attrib)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      raf = requestAnimationFrame(render)
    }

    /* Pause rendering when footer is off-screen */
    const visObs = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting },
      { threshold: 0 }
    )
    visObs.observe(canvas.parentElement)

    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      visObs.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}

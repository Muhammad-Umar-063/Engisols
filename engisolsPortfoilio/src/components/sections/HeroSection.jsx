import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { useAspect, useTexture } from '@react-three/drei'
import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three/webgpu'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import {
  abs,
  blendScreen,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  pass,
  mix,
  add,
} from 'three/tsl'

const TEXTUREMAP = { src: 'https://i.postimg.cc/XYwvXN8D/img-4.png' }
const DEPTHMAP   = { src: 'https://i.postimg.cc/2SHKQh2q/raw-4.webp' }

// Register all THREE classes (including WebGPU-specific ones) with R3F's reconciler
extend(THREE)

/* ─── POST-PROCESSING ─── */
const PostProcessing = ({ strength = 1, threshold = 1, fullScreenEffect = true }) => {
  const { gl, scene, camera } = useThree()
  const progressRef = useRef({ value: 0 })

  const render = useMemo(() => {
    const postProcessing = new THREE.PostProcessing(gl)
    const scenePass      = pass(scene, camera)
    const scenePassColor = scenePass.getTextureNode('output')
    const bloomPass      = bloom(scenePassColor, strength, 0.5, threshold)

    const uScanProgress = uniform(0)
    progressRef.current = uScanProgress

    const uvY      = uv().y
    const scanLine = smoothstep(0, float(0.05), abs(uvY.sub(float(uScanProgress.value))))
    const redOverlay = vec3(1, 0, 0).mul(oneMinus(scanLine)).mul(0.4)

    const withScanEffect = mix(
      scenePassColor,
      add(scenePassColor, redOverlay),
      fullScreenEffect ? smoothstep(0.9, 1.0, oneMinus(scanLine)) : 1.0,
    )

    postProcessing.outputNode = withScanEffect.add(bloomPass)
    return postProcessing
  }, [camera, gl, scene, strength, threshold, fullScreenEffect])

  useFrame(({ clock }) => {
    progressRef.current.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5
    render.renderAsync()
  }, 1)

  return null
}

/* ─── 3-D SCENE ─── */
const WIDTH  = 300
const HEIGHT = 300

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src])
  const meshRef  = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (rawMap && depthMap) setVisible(true)
  }, [rawMap, depthMap])

  const { material, uniforms } = useMemo(() => {
    const uPointer  = uniform(new THREE.Vector2(0))
    const uProgress = uniform(0)
    const strength  = 0.01

    const tDepthMap = texture(depthMap)
    const tMap      = texture(rawMap, uv().add(tDepthMap.r.mul(uPointer).mul(strength)))

    const aspect   = float(WIDTH).div(HEIGHT)
    const tUv      = vec2(uv().x.mul(aspect), uv().y)
    const tiling   = vec2(120.0)
    const tiledUv  = mod(tUv.mul(tiling), 2.0).sub(1.0)
    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2))
    const dist     = float(tiledUv.length())
    const dot      = float(smoothstep(0.5, 0.49, dist)).mul(brightness)
    const flow     = oneMinus(smoothstep(0, 0.02, abs(tDepthMap.sub(uProgress))))
    const mask     = dot.mul(flow).mul(vec3(10, 0, 0))
    const final    = blendScreen(tMap, mask)

    const mat = new THREE.MeshBasicNodeMaterial({
      colorNode: final,
      transparent: true,
      opacity: 0,
    })

    return { material: mat, uniforms: { uPointer, uProgress } }
  }, [rawMap, depthMap])

  const [w, h] = useAspect(WIDTH, HEIGHT)

  useFrame(({ clock }) => {
    uniforms.uProgress.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5
    const mat = meshRef.current?.material
    if (mat && 'opacity' in mat) {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, visible ? 1 : 0, 0.07)
    }
  })

  useFrame(({ pointer }) => {
    uniforms.uPointer.value = pointer
  })

  return (
    <mesh ref={meshRef} scale={[w * 0.4, h * 0.4, 1]} material={material}>
      <planeGeometry />
    </mesh>
  )
}

/* ─── TITLE WORDS ─── */
const TITLE_WORDS = ['We', 'Engineer', "What's", 'Next.']

/* ─── HERO SECTION ─── */
export default function HeroSection() {
  const [visibleWords, setVisibleWords]   = useState(0)
  const [subtitleVisible, setSubtitleVisible] = useState(false)

  useEffect(() => {
    if (visibleWords < TITLE_WORDS.length) {
      const t = setTimeout(() => setVisibleWords((v) => v + 1), 580)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setSubtitleVisible(true), 700)
    return () => clearTimeout(t)
  }, [visibleWords])

  return (
    <section id="home">
      <canvas id="hero-particles" />

      {/* ── Overlay: badge · title · subtitle · stats · CTA ── */}
      <div className="hero-futuristic-overlay">
        <div className="hero-badge hero-animate" style={{ '--d': '0.1s' }}>
          Available for New Projects
        </div>

        <h1 className="hero-futuristic-title">
          {TITLE_WORDS.map((word, i) => (
            <span
              key={i}
              className={`hero-fword${visibleWords > i ? ' in' : ''}`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              {word}
            </span>
          ))}
        </h1>

        <p className={`hero-futuristic-sub${subtitleVisible ? ' in' : ''}`}>
          ENGISOLS — intelligent digital solutions for a world that never slows down.
        </p>

        <div className="hero-stats hero-animate" style={{ '--d': '1.9s' }}>
          <div>
            <div className="hero-stat-num">
              <span className="count-up" data-target="120" data-suffix="+">120+</span>
            </div>
            <div className="hero-stat-label">Projects Delivered</div>
          </div>
          <div>
            <div className="hero-stat-num">
              <span className="count-up" data-target="98" data-suffix="%">98%</span>
            </div>
            <div className="hero-stat-label">Client Retention</div>
          </div>
          <div>
            <div className="hero-stat-num">
              <span className="count-up" data-target="5" data-suffix="yr+">5yr+</span>
            </div>
            <div className="hero-stat-label">Industry Experience</div>
          </div>
        </div>

        <a href="#about" className="explore-btn">
          Scroll to explore
          <span className="explore-arrow">
            <svg
              width="20"
              height="20"
              viewBox="0 0 22 22"
              fill="none"
              className="arrow-svg"
            >
              <path d="M11 5V17" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 12L11 17L16 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </a>
      </div>

      {/* ── WebGPU Canvas ── */}
      <Canvas
        flat
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        gl={async (props) => {
          const renderer = new THREE.WebGPURenderer(props)
          await renderer.init()
          return renderer
        }}
      >
        <PostProcessing fullScreenEffect />
        <Scene />
      </Canvas>
    </section>
  )
}

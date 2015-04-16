const canvas    = document.body.appendChild(document.createElement('canvas'))
const gl        = require('gl-context')(canvas, render)
const fit       = require('canvas-fit')
const glslify   = require('glslify')
const Particles = require('./')

const logics = [
  glslify(`
    precision mediump float;

    #define PI 3.14159265359

    uniform sampler2D data;
    uniform float time;
    uniform vec2 resolution;

    #pragma glslify: noise = require('glsl-noise/simplex/3d')

    void main() {
      vec2 uv       = gl_FragCoord.xy / resolution;
      vec4 tData    = texture2D(data, uv);
      vec2 position = tData.xy;
      vec2 speed    = tData.zw;

      speed.x += noise(vec3(position * 2.125, uv.x + time)) * 0.000225;
      speed.y += noise(vec3(position * 2.125, uv.y + time + 1000.0)) * 0.000225;

      float r = length(position);
      float a;

      if (r > 0.001) {
        a = atan(position.y, position.x);
      } else {
        a = 0.0;
      }

      position.x += cos(a + PI * 0.5) * 0.005;
      position.y += sin(a + PI * 0.5) * 0.005;

      position += speed;
      speed *= 0.975;
      position *= 0.995;

      gl_FragColor = vec4(position, speed);
      gl_FragColor = vec4(position, speed);
    }
  `, { inline: true }),
  glslify(`
    precision mediump float;

    uniform sampler2D data;
    uniform float time;
    uniform vec2 resolution;

    #pragma glslify: noise = require('glsl-noise/simplex/3d')

    void main() {
      vec2 uv       = gl_FragCoord.xy / resolution;
      vec4 tData    = texture2D(data, uv);
      vec2 position = tData.xy;
      vec2 speed    = tData.zw;

      speed.x += noise(vec3(position * 2.125, uv.x + time)) * 0.0005;
      speed.y += noise(vec3(position * 2.125, uv.y + time + 1000.0)) * 0.0005;

      position += speed;
      speed *= 0.975;
      position *= 0.995;

      gl_FragColor = vec4(position, speed);
      gl_FragColor = vec4(position, speed);
    }
  `, { inline: true })
]

const particles = Particles(gl, {
  shape: [64, 64],
  logic: logics[0],
  vert: `
    precision mediump float;

    uniform sampler2D data;
    uniform vec2 resolution;
    attribute vec2 uv;

    void main() {
      vec4 tData = texture2D(data, uv);
      vec2 position = tData.xy;

      position.x *= resolution.y / resolution.x;

      gl_PointSize = 4.0;
      gl_Position = vec4(position, 1, 1);
    }
  `,
  frag: `
    precision mediump float;

    void main() {
      vec2  p = (gl_PointCoord.xy - 0.5) * 2.0;
      float d = 1.0 - dot(p, p);

      gl_FragColor = vec4(d * vec3(0.15, 0.2, 0.25), 1);
    }
  `
})

particles.populate(function(u, v, data) {
  var a = Math.random() * Math.PI * 2
  var l = Math.random() * 0.04
  data[0] = 0
  data[1] = 0
  data[2] = Math.cos(a) * l
  data[3] = Math.sin(a) * l
})

const start = Date.now()

function render() {
  const width  = gl.drawingBufferWidth
  const height = gl.drawingBufferHeight

  // Disabling blending here is important – if it's still
  // enabled your simulation will behave differently
  // to what you'd expect.
  gl.disable(gl.BLEND)
  particles.step(function(uniforms) {
    uniforms.time = (Date.now() - start) / 1000
  })

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE)
  gl.clearColor(0.045, 0.02, 0.095, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, width, height)

  particles.draw(function(uniforms) {
    uniforms.resolution = [width, height]
  })
}

window.addEventListener('resize', fit(canvas), false)

logics.forEach(function(source, i) {
  var el = document.body.appendChild(document.createElement('div'))

  el.innerHTML = i + 1
  el.style.position = 'absolute'
  el.style.cursor = 'pointer'
  el.style.color = '#66c4ff'
  el.style.zIndex = 9999
  el.style.left = (1.25 + i * 1.25) + 'em'
  el.style.top = '1.25em'
  el.style.fontFamily = '"Ubuntu Mono", monospace'

  el.addEventListener('click', function(e) {
    particles.setLogicShader(logics[i])
  }, false)
})

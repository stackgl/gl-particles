var triangle = require('a-big-triangle')
var Geom     = require('gl-geometry')
var Shader   = require('gl-shader')
var ndarray  = require('ndarray')
var FBO      = require('gl-fbo')

module.exports = Particles

var logicVert = [
  'precision mediump float;',
  'attribute vec2 position;',
  'void main() {',
  '  gl_Position = vec4(position, 1, 1);',
  '}'
].join('\n')

function Particles(gl, options) {
  if (!(this instanceof Particles))
    return new Particles(gl, options)

  options = options || {}

  this.gl = gl

  if (!options.logic) throw new Error('Please pass in the "logic" shader option')
  if (!options.vert)  throw new Error('Please pass in the "vert" shader option')
  if (!options.frag)  throw new Error('Please pass in the "frag" shader option')

  this.shape  = options.shape || [64, 64]
  this.logic  = Shader(gl, logicVert, options.logic)
  this.render = Shader(gl, options.vert, options.frag)

  this.geom = Geom(gl)
  this.geom.attr('uv', generateLUT(this.shape), {
    size: 2
  })

  this.prev = FBO(gl, [this.shape[0], this.shape[1]], { float: true })
  this.curr = FBO(gl, [this.shape[0], this.shape[1]], { float: true })
}

Particles.prototype.step = function(update) {
  this.curr.bind()
  this.gl.viewport(0, 0, this.shape[0], this.shape[1])

  this.logic.bind()
  this.logic.uniforms.resolution = this.shape
  this.logic.uniforms.data = this.prev.color[0].bind(0)

  if (update) update(this.logic.uniforms)

  triangle(this.gl)
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)

  var prev  = this.prev
  this.prev = this.curr
  this.curr = prev
}

Particles.prototype.draw = function(update) {
  this.geom.bind(this.render)
  this.render.uniforms.data = this.prev.color[0].bind(0)

  if (update) update(this.render.uniforms)
  this.geom.draw(this.gl.POINTS)
}

Particles.prototype.populate = function(map) {
  var data = new Float32Array(this.shape[0] * this.shape[1] * 4)
  var vec4 = new Float32Array(4)
  var i    = 0

  for (var x = 0; x < this.shape[0]; x++)
  for (var y = 0; y < this.shape[1]; y++) {
    map(x, y, vec4)

    data[i++] = vec4[0]
    data[i++] = vec4[1]
    data[i++] = vec4[2]
    data[i++] = vec4[3]

    vec4[0] = 0
    vec4[1] = 0
    vec4[2] = 0
    vec4[3] = 0
  }

  var pixels = ndarray(data, [this.shape[0], this.shape[1], 4])

  this.prev.color[0].setPixels(pixels)
  this.curr.color[0].setPixels(pixels)
}

function generateLUT(shape) {
  var size = shape[0] * shape[1] * 2
  var data = new Float32Array(size)
  var k    = 0

  for (var i = 0; i < shape[0]; i++)
  for (var j = 0; j < shape[1]; j++) {
    var u = i / (shape[0] - 1)
    var v = j / (shape[1] - 1)

    data[k++] = u
    data[k++] = v
  }

  return data
}

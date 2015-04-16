# gl-particles

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Convenience module for FBO-driven particle simulations.

**[view demo](http://stack.gl/gl-particles/)**

## Usage

[![NPM](https://nodei.co/npm/gl-particles.png)](https://nodei.co/npm/gl-particles/)

See [demo.js](demo.js) for a full example.

### `particles = Particles(gl, options)`

Creates a new particle simulation given a WebGLContext `gl` and set
of `options`:

* `logic`: the logic shader for simulating the particles, as a string. Required.
* `vert`: the vertex shader responsible for determining the rendered particles'
  position and size. Required.
* `frag`: the fragment shader responsible for determining the color/texture of
  each particle. Required.
* `shape`: a `[width, height]` array for the dimensions of the particle texture.
  This determines the total amount of particles, which should be `width * height`.
  Defaults to `[64, 64]`.

Your logic shader will automatically be assigned the following uniforms:

* `sampler2D data`: the particle data texture.
* `vec2 resolution`: the width/height of the data texture.

And your fragment/vertex shaders will be assigned the following:

* `sampler2D data`: the particle data texture.

### `particles.populate((u, v, vec4) =>)`

Populates the data for each particle in your FBO textures individually.

* `u` is the horizontal index of the particle in pixels.
* `v` is the vertical index of the particle in pixels.
* `vec4` is a 4-element array which you should modify in-place to update
  the current particle's values.

For example, if you have 2D positions for your particles you would set them
randomly like so:

``` javascript
particles.populate(function(u, v, vec4) {
  vec4[0] = Math.random() * 2 - 1
  vec4[1] = Math.random() * 2 - 1
})
```

### `particles.step((uniforms) =>)`

Runs one step of the `logic` shader – should generally be done once per
frame.

You may optionally pass in a function to update the shader's uniforms, e.g.:

``` javascript
var start = Date.now()

particles.step(function(uniforms) {
  uniforms.time = (Date.now() - start) / 1000
})
```

*Note that this will modify your WebGL state. Specifically, it will reset
your current framebuffer, viewport and shader.*

### `particles.draw((uniforms) =>)`

Draws your particles to the screen using the `vert` and `frag` shaders.

As with `particles.step`, you may pass in an optional function for updating
the shader's uniforms.

### `particles.setLogicShader(logicShaderSource)`

Change the logic shader to `logicShaderSource`.

## Contributing

See [stackgl/contributing](https://github.com/stackgl/contributing) for details.

## License

MIT. See [LICENSE.md](http://github.com/stackgl/gl-particles/blob/master/LICENSE.md) for details.

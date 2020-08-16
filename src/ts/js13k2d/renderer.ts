import { List, Node } from './list';

// const DEVELOPMENT = process.env.NODE_ENV === 'development';

enum GL_ENUM
{
  GL_VERTEX_SHADER = 35633,
  GL_FRAGMENT_SHADER = 35632,
  GL_ARRAY_BUFFER = 34962,
  GL_ELEMENT_ARRAY_BUFFER = 34963,
  GL_STATIC_DRAW = 35044,
  GL_DYNAMI_CDRAW = 35048,
  GL_RGBA = 6408,
  GL_UNSIGNED_BYTE = 5121,
  GL_FLOAT = 5126,
  GL_TRIANGLES = 4,
  GL_DEPTH_TEST = 2929,
  GL_LESS = 513,
  GL_LEQUAL = 515,
  GL_BLEND = 3042,
  GL_ZERO = 0,
  GL_ONE = 1,
  GL_SRC_ALPHA = 770,
  GL_ONE_MINUS_SRC_ALPHA = 771,
  GL_COLOR_BUFFER_BIT = 16384,
  GL_DEPTH_BUFFER_BIT = 256,
  GL_TEXTURE_2D = 3553,
  GL_NEAREST = 9728,
  GL_TEXTURE_MAG_FILTER = 10240,
  GL_TEXTURE_MIN_FILTER = 10241
}

const vertexShader = `attribute vec2 g;
attribute vec2 a;
attribute vec2 t;
attribute float r;
attribute vec2 s;
attribute vec4 u;
attribute vec4 c;
attribute float z;
uniform mat4 m;
varying vec2 v;
varying vec4 i;
void main(){
v=u.xy+g*u.zw;
i=c.abgr;
vec2 p=(g-a)*s;
float q=cos(r);
float w=sin(r);
p=vec2(p.x*q-p.y*w,p.x*w+p.y*q);
p+=a+t;
gl_Position=m*vec4(p,z,1);}`;

const fragmentShader = `precision mediump float;
uniform sampler2D x;
uniform float j;
varying vec2 v;
varying vec4 i;
void main(){
vec4 c=texture2D(x,v);
gl_FragColor=c*i;
if(j>0.0){
if(c.a<j)discard;
gl_FragColor.a=1.0;};}`;

const maxBatch = 65535;
const depth = 1e5;

class Layer {
  zIndex: number;
  opaque: List<Sprite>;
  transparent: List<Sprite>;

  constructor(z: number) {

    this.zIndex = z;
    this.opaque = new List();
    this.transparent = new List();
  }

  add(sprite: Sprite) {
    sprite.remove();
    sprite.layer = this;
    sprite.node = ((sprite.alpha !== 1 || sprite.frame.alpha === 0) ? this.transparent : this.opaque).add(sprite);
  }
};



export class TextureView {
  anchor: Point;
  size: Point;
  uvs: number[];
  alpha: number;
  glTexture: any;
  srcWidth: number;
  srcHeight: number;
        
  frame(origin: Point, size: Point, anchor?: Point) {
    const frame = new TextureView();
    frame.size = size;
    frame.anchor = anchor || this.anchor;
    frame.uvs = [
      origin.x / this.srcWidth,
      origin.y / this.srcHeight,
      size.x / this.srcWidth,
      size.y / this.srcHeight,
    ];
    frame.alpha = this.alpha;
    frame.glTexture = this.glTexture;
    frame.srcWidth = this.srcWidth;
    frame.srcHeight = this.srcHeight;
    return frame;
    }
  }
  
export class Sprite
{
  frame: TextureView;
  visible: boolean;
  position: Point;
  rotation: number;
  scale: Point;
  tint: number;
  a: number;
  layer: Layer | null;
  node: Node<Sprite> | null;

  constructor(frame: TextureView, properties?: any) {
    this.frame = frame;
    this.visible = true;
    this.position = new Point();
    this.rotation = 0;
    this.scale = new Point();
    this.tint = 0xffffff;
    this.a = 1.0;
    this.layer = null;
    this.node = null;
  }

  get alpha() {
    return this.a;
  }

  set alpha(value: number) {
    const change = (value < 1 && this.a === 1) || (value === 1 && this.a < 1);
    this.a = value;
    if(change && this.frame.alpha > 0 && this.layer) this.layer.add(this);
  }

  remove() {
    if(this.node) this.node.remove();
    this.layer = null;
    this.node = null;
  }
};

class Point {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.set(x || 0, y || x);
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }
};

const nullFrame = new TextureView();
nullFrame.glTexture = 0;

export const Renderer = (canvas: HTMLCanvasElement, scale: number = 1, options?: any, ) => {
  const zeroLayer = new Layer(0);
  const layers = [zeroLayer];

  const floatSize = 2 + 2 + 1 + 2 + 4 + 1 + 1;
  const byteSize = floatSize * 4;
  const arrayBuffer = new ArrayBuffer(maxBatch * byteSize);
  const floatView = new Float32Array(arrayBuffer);
  const uintView = new Uint32Array(arrayBuffer);

  const opts: WebGLContextAttributes = Object.assign({ antialias: false, alpha: false }, options);
  const blend = opts.alpha ? GL_ENUM.GL_ONE :  GL_ENUM.GL_SRC_ALPHA;

  const gl = canvas.getContext('webgl', opts);

  /*
  if (DEVELOPMENT) {
    if (!gl) {
      throw new Error('WebGL not found');
    }
  }
  */

  const ext = gl.getExtension('ANGLE_instanced_arrays');

  /*
  if (DEVELOPMENT) {
    if (!ext) {
      throw new Error('Requared ANGLE_instanced_arrays extension not found');
    }
  }
  */

  const compileShader = (source: string, type: GL_ENUM) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    /*
    if (DEVELOPMENT) {
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
      }
    }
    */

    return shader;
  };

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(vertexShader, GL_ENUM.GL_VERTEX_SHADER));
  gl.attachShader(program, compileShader(fragmentShader, GL_ENUM.GL_FRAGMENT_SHADER));
  gl.linkProgram(program);

  /*
  if (DEVELOPMENT) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(error);
    }
  }
  */

  const createBuffer = (type: GL_ENUM, src: any, usage?: GL_ENUM) => {
    gl.bindBuffer(type, gl.createBuffer());
    gl.bufferData(type, src, usage || GL_ENUM.GL_STATIC_DRAW);
  };

  const bindAttrib = (name: string, size: number, stride?: number, divisor?: number, offset?: number, type?: GL_ENUM, norm?: boolean) => {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, type || GL_ENUM.GL_FLOAT, !!norm, stride || 0, offset || 0);
    divisor && ext.vertexAttribDivisorANGLE(location, divisor);
  };

  // indicesBuffer
  createBuffer(GL_ENUM.GL_ELEMENT_ARRAY_BUFFER, new Uint8Array([0, 1, 2, 2, 1, 3]));

  // vertexBuffer
  createBuffer(GL_ENUM.GL_ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]));

  // vertexLocation
  bindAttrib('g', 2);

  // dynamicBuffer
  createBuffer(GL_ENUM.GL_ARRAY_BUFFER, arrayBuffer, GL_ENUM.GL_DYNAMI_CDRAW);

  // anchorLocation
  bindAttrib('a', 2, byteSize, 1);
  // scaleLocation
  bindAttrib('s', 2, byteSize, 1, 8);
  // rotationLocation
  bindAttrib('r', 1, byteSize, 1, 16);
  // translationLocation
  bindAttrib('t', 2, byteSize, 1, 20);
  // uvsLocation
  bindAttrib('u', 4, byteSize, 1, 28);
  // colorLocation
  bindAttrib('c', 4, byteSize, 1, 44, GL_ENUM.GL_UNSIGNED_BYTE, true);
  // zLocation
  bindAttrib('z', 1, byteSize, 1, 48);

  const getUniformLocation = (name: string) => gl.getUniformLocation(program, name);
  const matrixLocation = getUniformLocation('m');
  const textureLocation = getUniformLocation('x');
  const alphaTestLocation = getUniformLocation('j');

  let width: number;
  let height: number;

  let count = 0;
  let currentFrame: TextureView = nullFrame;
  let alphaTestMode: boolean;

  const resize = () => {
    width = canvas.clientWidth * scale | 0;
    height = canvas.clientHeight * scale | 0;

    const change = canvas.width !== width || canvas.height !== height;

    canvas.width = width;
    canvas.height = height;

    return change;
  };

  const flush = () => {
    if (!count) return;

    /*
    if (alphaTestMode) {
      gl.disable(GL_BLEND);
    } else {
      gl.enable(GL_BLEND);
      gl.blendFunc(blend, GL_ONE_MINUS_SRC_ALPHA);
    }
    */

    gl.blendFunc(alphaTestMode ? GL_ENUM.GL_ONE : blend, alphaTestMode ? GL_ENUM.GL_ZERO : GL_ENUM.GL_ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(alphaTestMode ? GL_ENUM.GL_LESS : GL_ENUM.GL_LEQUAL);
  
    gl.bindTexture(GL_ENUM.GL_TEXTURE_2D, currentFrame.glTexture);
    gl.uniform1i(textureLocation, currentFrame.glTexture);
    gl.uniform1f(alphaTestLocation, alphaTestMode ? currentFrame.glTexture : 0);
  
    gl.bufferSubData(GL_ENUM.GL_ARRAY_BUFFER, 0, floatView.subarray(0, count * floatSize));
    ext.drawElementsInstancedANGLE(GL_ENUM.GL_TRIANGLES, 6, GL_ENUM.GL_UNSIGNED_BYTE, 0, count);

    count = 0;
  };

  const draw = (sprite: Sprite) => {
    if (!sprite.visible) return;

    if (count === maxBatch) flush();

    const { frame } = sprite;
    const { uvs } = frame;

    if (currentFrame.glTexture !== frame.glTexture) {
      currentFrame.glTexture && flush();
      currentFrame = frame;
    }

    let i = count * floatSize;

    floatView[i++] = frame.anchor.x;
    floatView[i++] = frame.anchor.y;

    floatView[i++] = sprite.scale.x * frame.size.x;
    floatView[i++] = sprite.scale.y * frame.size.y;

    floatView[i++] = sprite.rotation;

    floatView[i++] = sprite.position.x;
    floatView[i++] = sprite.position.y;

    /* eslint-disable prefer-destructuring */
    floatView[i++] = uvs[0];
    floatView[i++] = uvs[1];
    floatView[i++] = uvs[2];
    floatView[i++] = uvs[3];
    /* eslint-enable prefer-destructuring */

    uintView[i++] = (((sprite.tint & 0xffffff) << 8) | ((sprite.a * 255) & 255)) >>> 0;
    floatView[i] = sprite.layer.zIndex;

    count++;
  };

  const renderer = {
    gl,

    camera: {
      at: new Point(),
      to: new Point(), // 0 -> 1
      angle: 0,
    },

    background(r: number, g: number, b: number, a: number) {
      gl.clearColor(r, g, b, a === 0 ? 0 : (a || 1));
    },

    layer(z: number) {
      let l = layers.find(layer => layer.zIndex === z);

      if (!l) {
        l = new Layer(z);
        layers.push(l);
        layers.sort((a, b) => b.zIndex - a.zIndex);
      }

      return l;
    },

    add(sprite: Sprite) {
      zeroLayer.add(sprite);
    },

    texture(source: TexImageSource, alphaTest?: number, smooth?: boolean, mipmap?: boolean): TextureView {
      const srcWidth = source.width;
      const srcHeight = source.height;
      const t = gl.createTexture();

      gl.bindTexture(GL_ENUM.GL_TEXTURE_2D, t);
      // NEAREST || LINEAR
      gl.texParameteri(GL_ENUM.GL_TEXTURE_2D, GL_ENUM.GL_TEXTURE_MAG_FILTER, GL_ENUM.GL_NEAREST | +smooth);
      // NEAREST || LINEAR || NEAREST_MIPMAP_LINEAR || LINEAR_MIPMAP_LINEAR
      gl.texParameteri(
        GL_ENUM.GL_TEXTURE_2D,
        GL_ENUM.GL_TEXTURE_MIN_FILTER,
        GL_ENUM.GL_NEAREST | +smooth | (+mipmap << 8) | (+mipmap << 1),
      );
      gl.texImage2D(GL_ENUM.GL_TEXTURE_2D, 0, GL_ENUM.GL_RGBA, GL_ENUM.GL_RGBA, GL_ENUM.GL_UNSIGNED_BYTE, source);
      mipmap && gl.generateMipmap(GL_ENUM.GL_TEXTURE_2D);

      const tex = new TextureView();
      tex.size = new Point(srcWidth, srcHeight);
      tex.anchor = new Point();
      tex.uvs = [0, 0, 1, 1];
      tex.alpha = alphaTest === 0 ? 0 : (alphaTest || 1);
      tex.glTexture = t;
      tex.srcWidth = srcWidth;
      tex.srcHeight = srcHeight;

      return tex;
    },

    resize,

    render() {
      resize();

      const { at, to, angle } = renderer.camera;

      const x = at.x - width * to.x;
      const y = at.y - height * to.y;

      const c = Math.cos(angle);
      const s = Math.sin(angle);

      const w = 2 / width;
      const h = -2 / height;

      /*

      |   1 |    0| 0| 0|
      |   0 |    1| 0| 0|
      |   0 |    0| 1| 0|
      | at.x| at.y| 0| 1|

      x

      |  c| s| 0| 0|
      | -s| c| 0| 0|
      |  0| 0| 1| 0|
      |  0| 0| 0| 1|

      x

      |     1|     0| 0| 0|
      |     0|     1| 0| 0|
      |     0|     0| 1| 0|
      | -at.x| -at.y| 0| 1|

      x

      |     2/width|           0|        0| 0|
      |           0|   -2/height|        0| 0|
      |           0|           0| -1/depth| 0|
      | -2x/width-1| 2y/height+1|        0| 1|

      */

      // prettier-ignore
      const projection = [
        c * w, s * h, 0, 0,
        -s * w, c * h, 0, 0,
        0, 0, -1 / depth, 0,

        (at.x * (1 - c) + at.y * s) * w - 2 * x / width - 1,
        (at.y * (1 - c) - at.x * s) * h + 2 * y / height + 1,
        0, 1,
      ];

      gl.useProgram(program);
      gl.enable(GL_ENUM.GL_BLEND);
      gl.enable(GL_ENUM.GL_DEPTH_TEST);

      gl.uniformMatrix4fv(matrixLocation, false, projection);
      gl.viewport(0, 0, width, height);
      gl.clear(GL_ENUM.GL_COLOR_BUFFER_BIT | GL_ENUM.GL_DEPTH_BUFFER_BIT);

      currentFrame = null;

      alphaTestMode = true;
      layers.forEach(layer => layer.opaque.iter(draw));
      flush();

      alphaTestMode = false;
      for (let l = layers.length - 1; l >= 0; l--) {
        layers[l].transparent.iter(draw);
      }
      flush();
    },
  };

  resize();

  return renderer;
};


export default Renderer;

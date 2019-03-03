import { params as settings, gui}  from './settings.js'

'use strict'

var stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

class App {
  constructor() {
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer()
    this.geometry = new THREE.PlaneBufferGeometry(2, 2)

    this.video = document.createElement('video')
    this.video.src = 'assets/metropolis.webm'
    this.video.load()
    this.video.play()
    this.video.loop = true

    this.videoImage = document.createElement('canvas')
    this.videoImage.width = 320
    this.videoImage.height = 240

    this.videoImageContext = this.videoImage.getContext('2d')
    this.videoImageContext.fillStyle = '#000000'
    this.videoImageContext.fillRect(0, 0, this.videoImage.width, this.videoImage.height)

    this.videoTexture = new THREE.Texture(this.videoImage)
    this.videoTexture.minFilter = THREE.LinearFilter
    this.videoTexture.magFilter = THREE.LinearFilter

    this.uniforms = {
      time: {value: 1.0},
      warp: {value: 0.0},
      noiseRes: {value: 0.0},
      noiseMult: {value: 0.0},
      texture: {type: 't', value: this.videoTexture}
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: document.getElementById('vertex-shader').textContent,
      fragmentShader: document.getElementById('fragment-shader').textContent
    })
    //this.material = new THREE.MeshBasicMaterial({map: this.videoTexture, overdraw: true, side:THREE.DoubleSide})
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    document.getElementById('threejs').appendChild(this.renderer.domElement)

    window.addEventListener('resize', this.resize)
    this.resize()

    this.initAudio()
    this.autoHide()

    this.animate()
  }

  initAudio = () => {
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioContext = new AudioContext()
    this.meter = undefined
    try {
        // monkeypatch getUserMedia
        navigator.getUserMedia =
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia

        // ask for an audio input
        navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        },
        stream => {
          this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream)
          this.meter = createAudioMeter(this.audioContext)
          this.mediaStreamSource.connect(this.meter)
        },
        e => console.error(e))
    } catch (e) {
        alert('getUserMedia threw exception :' + e)
    }
  }

  updateUniforms = (timestamp) => {
    this.uniforms.time.value = timestamp
    this.uniforms.noiseRes.value = settings.staticSize * 40.0;

    if (this.meter) {
      let vol = this.meter.volume
      this.uniforms.warp.value = vol * settings.warp * 0.1;
      this.uniforms.noiseMult.value = vol * settings.staticSens * 0.5;
    }
  }

  updateVideo = () => {
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.videoImageContext.drawImage(this.video, 0, 0)
      if (this.videoTexture) {
        this.videoTexture.needsUpdate = true
      }
    }
  }

  resize = () => {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.renderer.setSize(this.width, this.height)
  }

  animate = (timestamp) => {
    stats.begin()
    this.updateVideo()
    this.updateUniforms(timestamp / 1000)
    this.renderer.render(this.scene, this.camera)
    stats.end()
    requestAnimationFrame(this.animate)
  }

  autoHide = () => {
    // Show/hide gui and stats based on mouse movement
    let timer
    $(document).mousemove(() => {
      if (timer) {
        clearTimeout(timer)
        timer = 0
      }

      $(stats.dom).fadeIn()
      $(gui.domElement).fadeIn()

      timer = setTimeout(() => {
        $(stats.dom).fadeOut()
        $(gui.domElement).fadeOut()
      }, 3000)
    })
  }
}

function main() {
  var app = new App()
}

main()

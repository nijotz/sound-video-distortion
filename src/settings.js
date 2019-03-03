'use strict'

let params = {
  warp: 5.0,
  staticSize: 5.0,
  staticSens: 5.0
}

let gui = new dat.GUI()

gui.remember(params)
gui.add(params, 'warp', 1.0, 10.0)
gui.add(params, 'staticSize', 1.0, 10.0)
gui.add(params, 'staticSens', 1.0, 10.0)

export { params, gui }

const DivRenderer = class extends ItemRenderer {
  constructor(_parent, bw, bh, img) {
    super()
    const div = UTIL.el("div")
    UTIL.prop(this, {
      _parent,
      img,
      bw,
      bh,
      div
    })
    div.className = "block"
    div.style.cssText = `width:${bw}px;height:${bh}px;backgroundImage:url(${img})`
  }
  get object() {
    return this.div
  }
  find(el) {
    return el == this.div
  }

  _remove() {
    const { div, _parent: parent } = this
    return new Promise((resolve, reject) => {
      div.style.transition = "transform ease-in 350ms"
      div.style.transform = "scale(0,0)"
      parent.delayTask(resolve, 350)
    })
  }

  _move(x, y) {
    const { div, bw, bh, _parent: parent } = this
    return new Promise((resolve, reject) => {
      const time = ((y * bh - parseInt(div.style.top)) / bh) * 100
      div.style.transition = `top ease-in ${time}ms`
      parent.delayTask(resolve, time)
    })
  }
  _render(x, y, type, selected) {
    const { div, bw, bh, img } = this
    div.style.left = bw * x + "px"
    div.style.top = bh * y + "px"
    div.style.backgroundPosition = -(bw * type) + "px"
    div.style.backgroundPositionY = (selected ? -bh : 0) + "px"
  }
}

const SectionRenderer = class extends Renderer {
  constructor({ stage, bg, w, h, c, r, img, itemFactory }) {
    super(itemFactory)
    stage = UTIL.el(stage)
    const bw = parseInt(w / c),
      bh = parseInt(h / r),
      _q = []
    UTIL.prop(this, {
      stage,
      bw,
      bh,
      w,
      h,
      c,
      r,
      img,
      isdown: false,
      _q,
      isAct: null,
      curr: 0
    })
    stage.style.cssText = `width:${w}px;height:${h}px;background-image:url('${bg}');
background-size:${bw}px ${bh}px`
    stage.setAttribute("unselectable", "on")
    stage.setAttribute("onselectstart", "return false")
    const f = t => {
      this.curr = t
      for (let i = _q.length; i--; ) {
        const task = _q[i]
        if (task.t <= t) {
          _q.splice(i, 1)
          task.f()
        }
      }
      this._renderLoop()
      requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  }

  delayTask(f, time) {
    this._q.push({
      f,
      t: this.curr + time
    })
  }
  activate() {
    const { stage } = this
    if (this.isAct === null) {
      stage.addEventListener("mousedown", e => this.isAct && this.dragDown(e))
      stage.addEventListener("mouseup", e => this.isAct && this.dragUp(e))
      stage.addEventListener("mouseleave", e => this.isAct && this.dragUp(e))
      stage.addEventListener("mousemove", e => this.isAct && this.dragMove(e))
    }
    this.isAct = true
  }
  deactivate() {
    this.isAct = false
  }
  _add(item) {
    this.stage.appendChild(item.object)
  }
  _remove(item) {
    this.stage.removeChild(item.object)
  }
  _render() {}

  _getItem(x, y) {
    const el = document.elementFromPoint(x, y)
    return this.some(v => v.find(el))
  }
  dragDown({ pageX: x, pageY: y }) {
    const item = this._getItem(x, y)
    if (!item) return
    this.isdown = true
  }
  dragMove({ pageX: x, pageY: y }) {
    const { isdown } = this
    if (!isdown) return
    const item = this._getItem(x, y)
    this.itemStart(item)
    if (item) this.itemNext(item)
  }
  dragUp({ pageX: x, pageY: y }) {
    const { isdown } = this
    if (!isdown) return
    this.isdown = false
    this.itemEnd()
  }
}

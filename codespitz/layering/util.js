const UTIL = {
  el: v => { 
    if(document.querySelector(v) == null) return document.createElement(v)
    return document.querySelector(v)
  },
  prop: (...arg) => Object.assign(...arg),
  ThrowSet: class extends Set {
    constructor() {
      super()
    }
    some(f) {
      try {
        this.forEach((v, i) => {
          if ((v = f(v, i))) throw v
        })
      } catch (r) {
        return r
      }
    }
  }
}
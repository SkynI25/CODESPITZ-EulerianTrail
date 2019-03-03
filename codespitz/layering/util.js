const UTIL = {
  el: v => document.querySelector(v),
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

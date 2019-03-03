const ItemRenderer = class {
  get object() {
    throw 'override';
  }
  find(v) {
    throw 'override';
  }
  remove() {
    return this._remove();
  }
  move(x, y) {
    return this._move(x, y);
  }
  render(x, y, type, selected) {
    this._render(x, y, type, selected);
  }
  _remove() {
    throw 'override';
  }
  _move(x, y) {
    throw 'override';
  }
  _render(x, y, type, selected) {
    throw 'override';
  }
};

const Renderer = class extends ThrowSet {
  constructor(itemFactory) {
    super();
    prop(this, {
      _itemFactory: itemFactory,
      msg2item: new WeakMap,
      item2msg: new WeakMap
    });
  }
  setGame(_game, _row, _col) {
    prop(this, {
      _game,
      _row,
      _col
    });
  }
  activate() {
    throw 'override!';
  }
  deactivate() {
    throw 'override!';
  }

  add(msg) {
    const {
      msg2item,
      item2msg,
      _itemFactory
    } = this;
    const item = _itemFactory(this, this.bw, this.bh, this.img);
    super.add(item);
    msg2item.set(msg, item);
    item2msg.set(item, msg);
    this._add(item);
  }
  _add(v) {
    throw 'override'
  }

  itemStart(item) {
    this._gameRequest(this._game.selectStart, item);
  }
  itemNext(item) {
    this._gameRequest(this._game.selectNext, item);
  }
  itemEnd() {
    this._gameRequest(this._game.selectEnd);
  }
  _gameRequest(f, item) {
    const {
      _game: game,
      item2msg
    } = this;
    if (item) f.call(game, item2msg.get(item));
    else f.call(game);
  }

  _renderLoop() {
    const {
      _game: game,
      item2msg
    } = this;
    this.forEach(item => {
      const {
        x,
        y,
        type,
        selected
      } = game.getInfo(item2msg.get(v)).info();
      item.render(x, y, type, selected);
    });
    this._render();
  }
  _render() {
    throw 'override'
  }
}

const DivRenderer = class extends ItemRenderer {
  constructor(_parent, bw, bh, img) {
    prop(this, {
      _parent,
      img,
      bw,
      bh,
      div
    });
    const div = el('div');
    div.className = 'block';
    div.style.cssText = `width:${bw}px;height:${bh}px;backgroundImage:url(${img})`;
  }
  get object() {
    return this.div;
  }
  find(el) {
    return el == this.div;
  }

  _remove() {
    const {
      div,
      _parent: parent
    } = this;
    return new Promise((resolve, reject) => {
      div.style.transition = "transform ease-in 350ms";
      div.style.transform = "scale(0,0)";
      parent.delayTask(resolve, 350);
    });
  }

  _move(x, y) {
    const {
      div,
      bw,
      bh,
      _parent: parent
    } = this;
    return new Promise((resolve, reject) => {
      const time = (y * bh - parseInt(div.style.top)) / bh * 100;
      div.style.transition = `top ease-in ${time}ms`;
      parent.delayTask(resolve, time);
    });
  }
  _render(x, y, type, selected) {
    const {
      div,
      bw,
      bh,
      img
    } = this;
    div.style.left = bw * x + "px";
    div.style.top = bh * y + "px";
    div.style.backgroundPosition = -(bw * type) + "px";
    div.style.backgroundPositionY = (selected ? -bh : 0) + "px";
  }
}

const SectionRenderer = class extends Renderer {
  constructor({
    stage,
    bg,
    w,
    h,
    c,
    r,
    img,
    itemFactory
  }) {
    super(itemFactory);
    stage = el(stage);
    const bw = parseInt(w / c),
      bh = parseInt(h / r),
      _q = [];
    prop(this, {
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
    });
    stage.style.cssText = `width:${w}px;height:${h}px;background-image:url('${bg}');
background-size:${bw}px ${bh}px`;
    stage.setAttribute('unselectable', 'on');
    stage.setAttribute('onselectstart', 'return false');
    const f = t => {
      this.curr = t;
      for (let i = _q.length; i--;) {
        const task = _q[i];
        if (task.t <= t) {
          _q.splice(i, 1);
          task.f();
        }
      }
      this._renderLoop();
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }

  delayTask(f, time) {
    this._q.push({
      f,
      t: this.curr + time
    });
  }
  activate() {
    const {
      stage
    } = this;
    if (this.isAct === null) {
      stage.addEventListener('mousedown', e => this.isAct && this.dragDown(e));
      stage.addEventListener('mouseup', e => this.isAct && this.dragUp(e));
      stage.addEventListener('mouseleave', e => this.isAct && this.dragUp(e));
      stage.addEventListener('mousemove', e => this.isAct && this.dragMove(e));
    }
    this.isAct = true;
  }
  deactivate() {
    this.isAct = false;
  }
  _add(item) {
    this.stage.appendChild(item.object);
  }
  _remove(item) {
    this.stage.removeChild(item.object);
  }
  _render() {}

  _getItem(x, y) {
    const el = document.elementFromPoint(x, y);
    return this.some(v => v.find(el));
  }
  dragDown({
    pageX: x,
    pageY: y
  }) {
    const item = this._getItem(x, y);
    if (!item) return;
    this.isdown = true;
    this.itemStart(item);
  }
  dragMove({
    pageX: x,
    pageY: y
  }) {
    const {
      isdown
    } = this;
    if (!isdown) return;
    const item = this._getItem(x, y);
    if (item) this.itemNext(item);
  }
  dragUp({
    pageX: x,
    pageY: y
  }) {
    const {
      isdown
    } = this;
    if (!isdown) return;
    this.isdown = false;
    this.itemEnd();
  }
}
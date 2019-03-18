const Item = class {
  static GET(type, x, y) {
    return new Item(type, x, y)
  }
  constructor(_type, _x, _y) {
    UTIL.prop(this, {
      _type,
      _x,
      _y,
      _selected: false,
      _prev: null
    })
  }
  get type() {
    return this._type
  }
  get x() {
    return this._x
  }
  get y() {
    return this._y
  }
  get selected() {
    return this._selected
  }
  get prev() {
    return this._prev
  }
  pos(x, y) {
    this._x = x
    this._y = y
  }
  select(item) {
    this._selected = true
    this._prev = item
  }
  unselect() {
    this._selected = false
    this._prev = null
  }
  isSelectedList(item) {
    if (!this._prev) return false
    if (this._prev === item) return true
    else return this._prev.isSelectedList(item)
  }
  isBorder(item) {
    return Math.abs(this.x - item.x) < 2 && Math.abs(this.y - item.y) < 2
  }
}

const GameMsg = class {
  pos(x, y) {
    if (x === undefined) return this._pos;
    this._pos = {
      x,
      y
    };
    return this;
  }
  info(x, y, type, selected) {
    if (x === undefined) return this._info;
    this._info = {
      x,
      y,
      type,
      selected
    };
  }
}

const Game = class {
  constructor(setting) {
    debugger
    UTIL.prop(this, setting, {
      items: new WeakSet,
      msg2item: new WeakMap,
      item2msg: new WeakMap
    });

    const {
      renderer,
      row,
      column,
      items,
      item2msg
    } = this;
    renderer.setGame(this, row, column);
    for (let c = 0; c < column; c++) {
      for (let r = 0; r < row; r++) this._add(c, r);
    }
    Promise.all(Array.from(items).map(item => {
      item.pos(item.x, item.y + row);
      return renderer.move(item2msg.get(item).pos(item.x, item.y));
    })).then(_ => renderer.activate())
  }

  _add(c, r) {
    const {
      itemType,
      row,
      items,
      msg2item,
      item2msg,
      renderer
    } = this;
    const item = new Item(itemType[parseInt(Math.random() * itemType.length)], c, r - row);
    const msg = new GameMsg;
    items.add(item);
    msg2item.set(msg, item);
    item2msg.set(item, msg);
    renderer.add(msg);
    return item;
  }
  _delete(item) {
    const msg = this.item2msg.get(item);
    this.msg2item.delete(msg);
    this.item2msg.delete(item);
    this.items.delete(item);
  }

  getInfo(msg) {
    const item = this.msg2item.get(msg);
    msg.info(item.x, item.y, item.type, item.selected);
    return msg;
  }

  selectStart(msg) {
    const item = this.msg2item.get(msg);
    if (!item) return;
    item.select();
    this.prevItem = item;
  }

  selectNext(msg) {
    const item = this.msg2item.get(msg);
    if (!item) return;
    const {
      prevItem: curr
    } = this;
    //자신이 아니고 타입이 같아야하며, 인접셀이어야 함
    if (item == curr || item.type != curr.type || !curr.isBorder(item)) return;
    if (!curr.isSelectedList(item)) { //선택된 게 아니면 add
      item.select(curr);
      this.prevItem = item;
    } else { //선택된 것 중에서 직전 것이면 release
      if (curr.prev === item) {
        this.prevItem = curr.prev;
        curr.unselect();
      }
    }
  }

  selectEnd() {
    const {
      items,
      item2msg,
      renderer
    } = this;
    const selected = [];
    items.forEach(v => v.selected && selected.push(item2msg.get(v)));
    if (selected.length > 2) renderer.remove(selected).then(_ => this._clear());
    else items.forEach(v => v.unselect());
    this.prevItem = null;
  }

  _clear(selectedItem) {
    const {
      items,
      renderer
    } = this;
    renderer.deactivate();
    items.forEach(item => item.selected && this._delete(item));
    this._dropBlocks();
  }

  _dropBlocks() {
    const {
      items,
      column,
      row,
      renderer,
      item2msg
    } = this;
    const allItems = [];
    for (let i = row; i--;) allItems.push([]);
    items.forEach(item => (allItems[item.y][item.x] = item));
    const coll = [];
    for (let c = 0; c < column; c++) {
      for (let r = row - 1; r > -1; r--) {
        if (allItems[r] && allItems[r][c]) {
          let cnt = 0;
          for (let j = r + 1; j < row; j++) {
            if (allItems[j] && !allItems[j][c]) cnt++;
          }
          if (cnt) {
            const item = allItems[r][c];
            item.pos(c, r + cnt);
            coll.push(renderer.move(item2msg.get(item).pos(item.x, item.y)));
          }
        }
      }
    }
    if (coll.length) Promise.all(coll).then(_ => this._fillStart());
  }

  _fillStart() {
    const {
      items,
      column,
      row,
      renderer,
      item2msg
    } = this;
    const allItems = [];
    for (let i = row; i--;) allItems.push([]);
    items.forEach(item => (allItems[item.y][item.x] = item));
    const coll = [];
    for (let c = 0; c < column; c++) {
      for (let r = row - 1; r > -1; r--) {
        if (allItems[r] && !allItems[r][c]) coll.push(this._add(c, r));
      }
    }
    if (!coll.length) return;
    Promise.all(coll.map(item => {
      item.pos(item.x, item.y + row);
      return renderer.move(item2msg.get(item).pos(item.x, item.y));
    })).then(_ => renderer.activate())
  }
}

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

const Renderer = class extends UTIL.ThrowSet {
  constructor(itemFactory) {
    super();
    UTIL.prop(this, {
      _itemFactory: itemFactory,
      msg2item: new WeakMap,
      item2msg: new WeakMap
    });
  }
  setGame(_game, _row, _col) {
    UTIL.prop(this, {
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
    this._add(item); // Renderer에 item이 제대로 add가 되는지 확인 필요 (현재 html에 div하나밖에 안찍힘)
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
      } = game.getInfo(item2msg.get(item)).info();
      item.render(x, y, type, selected);
    });
    this._render();
  }
  _render() {
    throw 'override'
  }
}
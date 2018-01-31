const DropTableObject = function(properties) {
  this.name = properties.name;
  this.path = properties.path;
  this.forcedDepth = properties.forcedDepth;
  this.stack = properties.stack;
  this.weight = properties.weight ? properties.weight : 1;
  this.isLootable = properties.isLootable;
  this.isAlways = properties.isAlways;
  this.totalWeight = 0;
};
DropTableObject.prototype.constructor = DropTableObject;

const DropTable = function(name, object) {
  this.name = name;
  this.objects = [];
  this.branchs = {};
};
DropTable.prototype.constructor = DropTable;

DropTable.prototype.clean = function(path) {
  return path.replace(/^\//g, "").replace(/\/$/g, "");
};

DropTable.prototype.getBranch = function(name, create) {
  var path = this.clean(name).split("/");

  if (!this.branchs[path[0]] && path[0] != this.name && create) {
    this.branchNames.push(path[0]);
    this.branchs[path[0]] = new DropTable({ name: path[0] });
  }
  if (path.length === 1) {
    return path[0] === this.name ? this : this.branchs[path[0]];
  } else if (path.length > 1) {
    var head = path.shift();
    var newPath = path.join("/");

    if (this.branchs[head]) {
      return this.branchs[head].getBranch(newPath, create);
    }
    if (create) {
      this.branchNames.push(head);
      this.branchs[head] = new DropTable({ name: head });
      return this.branchs[head].getBranch(newPath, create);
    }
  }
};

DropTable.prototype.addRange = function(objects) {
  for (var i = 0; i < objects.length; i++) {
    this.objects.push(new DropTableObject(objects[i]));
    this.totalWeight += objects[i].weight;
  }
};

DropTable.prototype.add = function(object) {
  this.objects.push(new DropTableObject(object));
  this.totalWeight += object.weight;
};

DropTable.prototype.roll = function() {
  var nextBranch;
  /*do {
      var item = randomPick(this.objects);
    }
    while( item.)*/
};

DropTable.prototype.randomPick = function(items) {
  var targetWeight = ~~(Math.random() * this.getTotalWeight(items));
  var currentWeight = 0;
  var pickedItem = null;
  for (var i = 0; i < items.length; i++) {
    currentWeight += items[i].weight;
    if (currentWeight < targetWeight) pickedItem = items[i];
  }

  return pickedItem;
};

Lootr.prototype.roll = function(catalogPath, allowedNesting, threshold) {
  var branch = this.getBranch(catalogPath, false);
  var items = this.allItems(allowedNesting);
  return branch.randomPick(
    items,
    allowedNesting,
    threshold === undefined ? 1.0 : threshold
  );
};

const LootManager = function(lootr) {
  this.rootLootr = lootr;
  this.dropTables = [];
};
LootManager.prototype.constructor = LootManager;

LootManager.prototype.addDropTable = function(dropTable) {
  this.dropTables.push(dropTable);
};

LootManager.prototype.loot = function(dropTableName) {
  if (this.dropTables.length === 0 || this.dropTables === undefined)
    return null;

  var dropTable = this.dropTables.find(element => {
    if (element.name == dropTableName) return element;
  });
  var rewards = [];

  for (var i = 0; i < dropTable.objects.length; i++) {
    var doObject = dropTable.objects[i];
  }

  //TODO:buraya bakılır
  rewards.push(this.getAlwaysPicks());

  for (var i = 0; i < this.dropTable.length; i++) {
    var item = this.roll(
      drops[i].from,
      drops[i].depth || Infinity,
      drops[i].luck
    );

    if (!item) {
      continue;
    }

    var json = JSON.stringify(item);
    var stack = !drops[i].stack
      ? 1
      : ("" + drops[i].stack).indexOf("-") > -1
        ? this.randomInRange(drops[i].stack)
        : drops[i].stack;
    var modify = drops[i].modify;

    for (var c = 0; c < stack; c++) {
      // clone the item from json
      var cloned = JSON.parse(json);

      // handle modifiers
      if (modify) {
        var modifier = this.modifiers[
          ~~(Math.random() * this.modifiers.length)
        ];

        if (modifier) {
          this.modify(cloned, modifier);
        }
      }

      rewards.push(cloned);
    }
  }

  return rewards;
};

function Lootr(name, weight, isAlways) {
  name = name || "root";
  name = this.clean(name);
  weight = weight ? 1 : weight;
  isAlways = isAlways === undefined ? false : isAlways;

  if (name.indexOf("/") > -1) {
    throw new Error("specified name should not contain a / separator");
  }

  this.rootItem = new Item({ name, weight, isAlways });
  this.items = [];
  this.branchs = {};
  this.modifiers = [];
}
Lootr.prototype.allItems = function(nesting) {
  var items = this.items.slice();

  nesting = nesting === undefined ? this.branchs.length : nesting;
  if (nesting > 0) items = items.concat(this.branchs[i].allItems(nesting - 1));

  return items;
};
Lootr.prototype.getTotalWeight = function(items) {
  var totalWeight = 0;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!items.isAlways) totalWeight += item.weight;
  }
  return totalWeight;
};
Lootr.prototype.add = function(item, path) {
  const _item = new Item(item);
  if (path === undefined) {
    this.items.push(_item);
  } else {
    var branch = this.branch(path);
    branch.items.push(_item);
  }

  return this;
};
Lootr.prototype.randomPick = function(items, threshold) {
  var weightOfPickedItem = ~~(Math.random() * this.getTotalWeight(items));
  var currentWeight = 0;
  var pickedItem = null;
  for (var i = 0; i < items.length; i++) {
    currentWeight += items[i].weight;
    if (currentWeight < weightOfPickedItem) pickedItem = items[i];
  }

  return pickedItem;
};

Lootr.prototype.getAlwaysPicks = function(items) {
  var alwaysItems = [];
  for (var i = 0; i < items.length; i++) {
    if (item.isAlways) alwaysItems.push(alwaysItems);
  }
  return alwaysItems;
};

const Item = function(properties) {
  this.name = properties.name;
  this.isAlways = properties.isAlways;
  this.weight = properties.weight;
};
Item.prototype.constructor = Item;

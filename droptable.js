const DropTableObject = function(properties) {
  this.forcedDepth = properties.forcedDepth;
  this.stack = properties.stack;
  this.weight = properties.weight ? properties.weight : 0;
  this.isLootable = properties.isLootable;
  this.isAlways = properties.isAlways;
};
DropTableObject.prototype.constructor = DropTableObject;

const DropTable = function(name, obj) {
  this.name = name;
  this._obj = obj;
  this.brancNames = [];
  this.branchs = {};
  this.totalWeight = 0;
};
DropTable.prototype.constructor = DropTable;

DropTable.prototype.randomInRange = function(range) {
  var bounds = range.split("-");
  if (bounds.length !== 2) {
    throw new Error("Wrong format. Correct Example: 2-9");
  } else {
    bounds = [bounds[0], bounds[bounds.length - 1]];
  }

  bounds[0] = parseInt(bounds[0], 10);
  bounds[1] = parseInt(bounds[1], 10);

  return Math.floor(Math.random() * (bounds[1] - bounds[0])) + bounds[0];
};

DropTable.prototype.clean = function(path) {
  return path.replace(/^\//g, "").replace(/\/$/g, "");
};

DropTable.prototype.branch = function(name) {
  return this.getBranch(name, true);
};

DropTable.prototype.getBranch = function(name, create) {
  var path = this.clean(name).split("/");
  if (!this.branchs[path[0]] && path[0] != this.name && create) {
    this.add(new DropTable(path[0]));
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
      this.add(new DropTable(head));
      return this.branchs[head].getBranch(newPath, create);
    }
  }
};

DropTable.prototype.setWeight = function(value) {
  var oldWeight = this._obj.weight;
  this._obj.weight = value;
  this.totalWeight += value - oldWeight;
};

DropTable.prototype.totalWeightInItems = function(items) {
  var totalWeight = 0;
  items.forEach(element => {
    totalWeight += items._obj.weight;
  });
};

DropTable.prototype.addRange = function(objects) {
  for (var i = 0; i < objects.length; i++) {
    this.branchs[objects[i].name] = objects[i];
    this.brancNames.push(objects[i].name);
    this.totalWeight += objects[i].weight;
  }
};

DropTable.prototype.add = function(object) {
  this.branchs[object.name] = object;
  this.brancNames.push(object.name);
  this.totalWeight += object.weight;
};

DropTable.prototype.allItemsInDepth = function(depth) {
  var items = [];

  for (var i = 0; i < this.branchNames.length; i++) {
    items.push(this.branchs[this.branchNames[i]]);
    if (depth > 0) {
      items = items.concat(
        this.branchs[this.branchNames[i]].allItemsInDepth(depth - 1)
      );
    }
  }
  return items;
};

DropTable.prototype.randomPick = function() {
  var targetWeight = ~~(Math.random() * this._obj.totalWeight);
  var currentWeight = 0;
  var pickedItem = null;
  for (var i = 0; i < this.branchNames.length; i++) {
    currentWeight += this.branchs[this.branchNames[i]].weight;
    if (currentWeight > targetWeight)
      pickedItem = this.branchs[this.branchNames[i - 1]];
  }

  return pickedItem;
};

DropTable.prototype.roll = function(catalogPath, forcedDepth) {
  var nextBranch = this.getBranch(catalogPath, false);
  var item = nextBranch.randomPick();
  if (!item.isLootable || forcedDepth > 0) {
    item = this.roll(item, forcedDepth - 1);
  }
  return item;
};

const LootManager = function(lootr) {
  this.rootLootr = lootr;
  this.dropTables = [];
};
LootManager.prototype.constructor = LootManager;

LootManager.prototype.addDropTable = function(dropTable) {
  this.dropTables.push(dropTable);
};

LootManager.prototype.loot = function(dropTableName, range) {
  if (this.dropTables.length === 0 || this.dropTables === undefined)
    return null;

  var dropTable = this.dropTables.find(element => {
    if (element.name == dropTableName) return element;
  });
  var rewards = [];

  for (var i = 0; i < dropTable.objects.length; i++) {
    var doObject = dropTable.objects[i];
  }

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

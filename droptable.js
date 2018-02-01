const randomNumber = require("random-number-csprng");

const clean = (module.exports.clean = function(path) {
  return path.replace(/^\//g, "").replace(/\/$/g, "");
});

function totalWeightInItems(items) {
  return items.reduce(function(total, item) {
    return total + item._obj.weight;
  }, 0);
}

const DropTableObject = function(properties) {
  return {
    forcedDepth: properties.forcedDepth,
    stack: properties.stack,
    weight: properties.weight ? properties.weight : 0,
    isLootable: properties.isLootable,
    isAlways: properties.isAlways
  };
};
const DropTable = function(name, obj) {
  return {
    name: name,
    _obj: obj,
    branchNames: [],
    branches: {},
    totalWeight: 0,
    setWeight: function(value) {
      const oldWeight = this._obj.weight;
      this._obj.weight = value;
      this.totalWeight += value - oldWeight;
    },
    totalWeightInItems: function(items) {
      return items.reduce(function(total, item) {
        return total + item._obj.weight;
      }, 0);
    },
    add: function(object) {
      this.branches[object.name] = object;
      this.branchNames.push(object.name);
      this.totalWeight += object.weight;
    },
    addRange: function(objects) {
      objects.forEach(object => {
        this.add(object);
      });
    },
    branch: function(name) {
      return this.getBranch(name, true);
    },
    getBranch: function(name, create) {
      const path = clean(name).split("/");
      if (
        create === true &&
        path[0] !== this.name &&
        this.branches[path[0]] != null
      ) {
        this.add(DropTable(path[0]));
      }
      if (path.length === 1) {
        return path[0] === this.name ? this : this.branches[path[0]];
      } else if (path.length > 1) {
        const head = path.shift();
        const newPath = path.join("/");
        if (this.branches[head] != null) {
          return this.branches[head].getBranch(newPath, create);
        } else if (create === true) {
          return this.branches[head].getBranch(newPath, create);
        } else {
          throw new Error("Branch is null");
        }
      } else {
        throw new Error("Path error");
      }
    },
    allItemsInDepth: function(depth) {
      return this.branchNames.reduce(function(items, branchName) {
        items.push(this.branches[branchName]);
        if (depth > 0) {
          items.concat(this.branches[branchName].allItemsInDepth(depth - 1));
        }
      }, []);
    },
    randomPick: async function() {
      const targetWeight = await randomNumber(0, this._obj.totalWeight);
      let currentWeight = 0;

      return this.branches[
        this.branchNames.find(name => {
          currentWeight += this.branches[name].weight;
          if (currentWeight > targetWeight) {
            return name;
          }
        })
      ];
    },
    roll: async function(catalogPath, forcedDepth) {
      const nextBranch = this.getBranch(catalogPath, false);
      let item = await nextBranch.randomPick();

      if (!item.isLootable || forcedDepth > 0) {
        return await this.roll(item, forcedDepth - 1);
      } else {
        return item;
      }
    }
  };
};

/*const LootManager = function(lootr) {
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

  const dropTable = this.dropTables.find(element => {
    if (element.name == dropTableName) return element;
  });
  const rewards = [];

  for (let i = 0; i < dropTable.objects.length; i++) {
    const doObject = dropTable.objects[i];
  }

  for (let i = 0; i < this.dropTable.length; i++) {
    let item = this.roll(
      drops[i].from,
      drops[i].depth || Infinity,
      drops[i].luck
    );

    if (!item) {
      continue;
    }

    const json = JSON.stringify(item);
    const stack = !drops[i].stack
      ? 1
      : ("" + drops[i].stack).indexOf("-") > -1
        ? this.randomInRange(drops[i].stack)
        : drops[i].stack;
    const modify = drops[i].modify;

    for (let c = 0; c < stack; c++) {
      // clone the item from json
      const cloned = JSON.parse(json);

      // handle modifiers
      if (modify) {
        const modifier = this.modifiers[
          Math.floor(Math.random() * this.modifiers.length)
          ];

        if (modifier) {
          this.modify(cloned, modifier);
        }
      }

      rewards.push(cloned);
    }
  }

  return rewards;
};*/

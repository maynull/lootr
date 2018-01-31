/*!
 * lootr
 * https://github.com/vincent/lootr
 *
 * Copyright 2014 Vincent Lark
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4, strict: false */
/*global module, define */
(function() {
  // global on the server, window in the browser
  var root = this;

  const Item = function(properties) {
    this.name = properties.name;
    this.isAlways = properties.isAlways;
    this.weight = properties.weight;
  };
  Item.prototype.constructor = Item;

  /**
   * Get a new branch
   *
   * @param {string} name Name of that branch
   */
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

  /**
   * Clean a path, trim left and right / characters.
   * This method is meant to be use internaly.
   *
   * @param  {string} path Path to cleanup
   *
   * @return {string}      A cleaned path
   */
  Lootr.prototype.clean = function(path) {
    return path.replace(/^\//g, "").replace(/\/$/g, "");
  };

  /**
   * Return a random number in the specified range.
   * This method is meant to be use internaly.
   *
   * @param  {string} range x-y
   *
   * @return {number} Random number in range
   */
  Lootr.prototype.randomInRange = function(range) {
    var bounds = range.split("-");

    switch (bounds.length) {
      case 0:
        bounds = [0, 5];
        break;
      case 1:
        bounds = [bounds[0], parseInt(bounds[0], 0) + 5];
        break;
      default:
        bounds = [bounds[0], bounds[bounds.length - 1]];
    }

    bounds[0] = parseInt(bounds[0], 10);
    bounds[1] = parseInt(bounds[1], 10);

    return Math.floor(Math.random() * (bounds[1] - bounds[0])) + bounds[0];
  };

  /**
   * Add an item in that branch, or the nested branch specified
   *
   * @param {object} item    Item to add
   * @param {string} catalog Path to branch (or top level if null)
   *
   * @return {Lootr} The current branch
   */
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

  /**
   * Return all items in the current and nested branchs
   *
   * @return {Array} Array of items
   */
  Lootr.prototype.allItems = function(nesting) {
    var items = this.items.slice();

    nesting = nesting === undefined ? this.branchs.length : nesting;
    if (nesting > 0)
      items = items.concat(this.branchs[i].allItems(nesting - 1));

    return items;
  };

  /**
   * Return or create a new branch under the current one
   *
   * @param  {string} name Branch name
   *
   * @return {Lootr}       The branch
   */
  Lootr.prototype.branch = function(name) {
    return this.getBranch(name, true);
  };

  /**
   * Return or create a new branch under the current one
   *
   * @param  {string}  name   Branch name
   * @param  {boolean} create If true, and the specified branch does not exist, create one
   *
   * @return {Lootr}       The branch
   */
  Lootr.prototype.getBranch = function(name, create) {
    var path = this.clean(name).split("/");

    // if the asked branch does not begin with the current branch
    // neither a first-level branch
    // and we've been asked to create
    // => create the asked branch
    if (!this.branchs[path[0]] && path[0] !== this.rootItem.name && create) {
      this.branchs[path[0]] = new Lootr(path[0]);
    }

    // get a branch at current level
    if (path.length === 1) {
      return path[0] === this.rootItem.name ? this : this.branchs[path[0]];

      // or nested
    } else if (path.length > 1) {
      var head = path.shift();
      var newPath = path.join("/");

      if (this.branchs[head]) {
        return this.branchs[head].getBranch(newPath, create);
      }

      if (create) {
        this.branchs[head] = new Lootr(head);
        return this.branchs[head].getBranch(newPath, create);
      }
    }
  };

  Lootr.prototype.getTotalWeight = function(items) {
    var totalWeight = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!items.isAlways) totalWeight += item.weight;
    }
    return totalWeight;
  };

  /**
   * Randomly pick an item.
   * @param  {Array} items all Items
   * @param  {Number} threshold
   *
   * @return {object}               Picked item
   */
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
  /**
   * Randomly pick an item from the specified branch
   *
   * @param  {string} catalogPath    Branch to get an item from
   * @param  {int}    allowedNesting Depth limit
   * @param  {Number} threshold      Chances (0-1) we go deeper
   *
   * @return {object}                Picked item
   */
  Lootr.prototype.roll = function(catalogPath, allowedNesting, threshold) {
    var branch = this.getBranch(catalogPath, false);
    var items = this.allItems(allowedNesting);
    return branch.randomPick(
      items,
      allowedNesting,
      threshold === undefined ? 1.0 : threshold
    );
  };

  /**
   * Roll against a looting table
   *
   * @param  {Array} drops Loot table
   * ```[ {from: '/equipment',         depth:Infinity, luck:1.0, stack:1 },
   *      {from: '/equipment/armor',   depth:Infinity, luck:0.5, stack:2 },
   *      {from: '/equipment/weapons', depth:Infinity, luck:0.8, stack:'2-10' } ]
   * ```
   *
   * @return {Array}       Array of items
   */
  Lootr.prototype.loot = function(dropTable) {
    if (dropTable.table.length === 0 || dropTable.table === undefined)
      return null;
    var rewards = [];
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

  /**
   * Add modifiers.
   *
   * @param {Array} modifiers List of strings like [ 'from the shadows', '$name of the sun', 'Golden $name' ]
   */
  Lootr.prototype.setModifiers = function(modifiers) {
    this.modifiers = modifiers;
  };

  /**
   * Add modifiers.
   *
   * @param {Array} modifiers List of strings like [ 'from the shadows', '$name of the sun', 'Golden $name' ]
   */
  Lootr.prototype.addModifier = function(modifier) {
    this.modifiers = modifiers || [];
    this.modifiers.push(modifier);
  };

  /**
   * Returns a new name from the given item.
   *
   * @param  {object} item An item
   *
   * @return {string}      A modified name, assuming there are modifiers available
   */
  Lootr.prototype.modify = function(item, modifier) {
    var modifierValues = {},
      modifier = JSON.parse(JSON.stringify(modifier));

    // we have a name modifier
    if (modifier.name) {
      // modifier is a regexp
      if (modifier.name.indexOf("$") > -1) {
        item.name = modifier.name
          // replace property names
          .replace(/(\$\w+)/g, this.modifyNameReplace.bind(item))
          // in case we don't have the replacement name
          .replace("  ", " ")
          // clean
          .trim();

        // modifier is a simple suffix
      } else {
        item.name += " " + modifier.name;
      }

      delete modifier.name;
    }

    // all other modifiers
    for (key in modifier) {
      var propModifier = modifier[key];

      // function giver
      if (typeof propModifier === "Function") {
        item[key] = propModifier(item);

        // math expression given
      } else if (propModifier.match(/^[\*\+\-\/]\d+$/)) {
        try {
          item[key] = Math.max(0, eval((item[key] || 0) + " " + propModifier));
        } catch (e) {}

        // range given
      } else {
        item[key] = this.randomInRange(propModifier);
      }
    }
  };

  Lootr.prototype.modifyProps = function(item, modifier) {
    return {};
  };

  /**
   * Return the replacement for the given match.
   *
   * @param  {string} match Matched token
   *
   * @return {return}       A replacement string
   */
  Lootr.prototype.modifyNameReplace = function(match) {
    // `this` is the current item to modify
    return (this[match.substr(1)] || "").toLowerCase();
  };

  const DropTableObject = function(properties) {
    this.name = properties.name;
    this.path = properties.path;
    this.forcedDepth = properties.forcedDepth;
    this.stack = properties.stack;
    this.weight = properties.weight;
    this.isLootable = properties.isLootable;
    this.isAlways = properties.isAlways;
    this.totalWeight = 0;
  };
  DropTableObject.prototype.constructor = DropTableObject;

  const DropTable = function(name, object) {
    this.name = name;
    this.objects = [];
  };
  DropTable.prototype.constructor = DropTable;

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

  DropTable.prototype.roll = function() {};

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
  ////////////////////////////////////////////////////////

  // Node.js
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Lootr;
  } else if (typeof define !== "undefined" && define.amd) {
    // AMD / RequireJS
    define([], function() {
      return Lootr;
    });
  } else {
    // included directly via <script> tag
    root.Lootr = Lootr;
  }
})();

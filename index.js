/*!
 * lootr 
 * https://github.com/vincent/lootr
 *
 * Copyright 2014 Vincent Lark
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global module: true */
'use strict';
(function () {

    function Lootr (name) {

        name = name || 'root';
        name = this.path(name);

        if (name.indexOf('/') > -1) {
            throw new Error('specified name should not contain a / separator');
        }

        this.name         = name;
        this.items        = [];
        this.branchs      = {};
        this.branchNames  = [];
    }

    Lootr.prototype.path = function(path) {
        return path.replace(/^\//g, '').replace(/\/$/g, '');
    };

    Lootr.prototype.add = function(catalogPath, item) {

        if (item === undefined) {
            this.items.push(catalogPath);
        
        } else {
            var branch = this.branch(catalogPath);
            branch.items.push(item);
        }

        return this;
    };

    Lootr.prototype.branch = function(name) {

        return this.getBranch(name, true);
    };

    Lootr.prototype.getBranch = function(name, create) {

        var path = this.path(name).split('/');

        if (! this.branchs[path[0]] && path[0] != this.name && create) {
            this.branchNames.push(path[0]);
            this.branchs[path[0]] = new Lootr(path[0]);
        }

        // get a branch at current level
        if (path.length === 1) {

            return path[0] === this.name ? this : this.branchs[path[0]];

        // or nested
        } else if (path.length > 1) {
            var head    = path.shift();
            var newPath = path.join('/');

            if (this.branchs[head]) {
                return this.branchs[head].getBranch(newPath, create);
            }

            if (create) {
                this.branchNames.push(head);
                this.branchs[head] = new Lootr(head);
                return this.branchs[head].getBranch(newPath, create);
            }
        }
    };

    Lootr.prototype.allItems = function() {

        var items = this.items.slice();

        for (var i = 0; i < this.branchNames.length; i++) {
            items = items.concat(this.branchs[ this.branchNames[i] ].allItems());
        }

        return items;
    };

    Lootr.prototype.randomPick = function(allowedNesting, threshold) {

        var picked = [];

        if (threshold === undefined) {
            threshold = 0.9;
        }

        if (Math.random() < threshold && this.items.length > 0) {
            picked.push(this.items[~~(Math.random() * this.items.length)]);
        }

        if (allowedNesting > 0) {
            for (var i = 0; i < this.branchNames.length; i++) {
                var nestedChance = Math.random();
                if (nestedChance <= threshold) {
                    var others = this.branchs[ this.branchNames[i] ].randomPick(allowedNesting - 1, threshold - Math.random() / allowedNesting);
                    if (others) {
                        picked = picked.concat(others);
                    }
                } else {
                    // console.log('nope', nestedChance, '>', threshold);
                }
            }
        }
        
        return this.items.length > 0 ? picked[~~(Math.random() * picked.length)] : null;
    };

    Lootr.prototype.roll = function(catalogPath, nesting, threshold) {

        var branch = this.getBranch(catalogPath);

        return branch.randomPick(nesting, threshold === undefined ? 1.0 : threshold);
    };

    Lootr.prototype.loot = function(drops) {

        var reward = [];

        for (var i = 0; i < drops.length; i++) {
            var item  = this.roll(drops[i].from, drops[i].depth || Infinity, drops[i].luck);

            if (! item) {
                continue;
            }

            var json  = JSON.stringify(item);
            var stack = drops[i].stack || 1;

            for (var c = 0; c < stack; c++) {
                reward.push(JSON.parse(json));
            }
        }

        return reward;
    };

    module.exports = Lootr;
})();

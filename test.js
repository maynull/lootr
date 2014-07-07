'use strict';

/*!
 * lootr
 * https://github.com/vincent/lootr
 *
 * Copyright 2014 Vincent Lark
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global exports: true, require: true */

var Lootr = require('./index.js');

var loot = new Lootr();

// Check our library is here
exports['lootr is present'] = function(test) {
    test.ok(Lootr, 'Lootr should be an object');
    test.done();
};

exports['looting setup'] = function(test) {

    loot.branch('equipment').add({ name: 'Stuff' });

    loot.branch('/equipment/weapons')
        .add({ name: 'Uzi' })
        .add({ name: 'Pistol' });

    loot.branch('/equipment/armor')
        .add({ name: 'Plates' })
        .add({ name: 'Leather' });
                        
    loot.branch('/equipment/armor/tough')
        .add({ name: 'Military vest' })
        .add({ name: 'CSI cap' });

    var weapons     = [ 'Uzi', 'Pistol' ];
    var simplarmors = [ 'Plates', 'Leather' ];
    var tougharmors = [ 'Military vest', 'CSI cap' ];
    var all         = [ 'Stuff' ].concat(weapons, simplarmors, tougharmors);

    test.ok(loot.roll('/equipment').name === 'Stuff', 'Should loot a useless equipment');

    test.ok(all.indexOf(loot.roll('/equipment', 3, 100).name) > -1, 'Should loot any equipment');
    
    test.ok(weapons.indexOf(loot.roll('/equipment/weapons', 3).name) > -1, 'Should loot a weapon');
    
    test.ok(simplarmors.indexOf(loot.roll('/equipment/armor').name) > -1, 'Should loot a simple armor');
    
    test.ok([].concat(simplarmors, tougharmors).indexOf(loot.roll('/equipment/armor', 1).name) > -1, 'Should loot an armor');

    test.done();
};

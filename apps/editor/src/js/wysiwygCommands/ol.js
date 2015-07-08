/**
 * @fileoverview Implements WysiwygCommand
 * @author Sungho Kim(sungho-kim@nhnent.com) FE Development Team/NHN Ent.
 */

'use strict';

var CommandManager = require('../commandManager');

/**
 * OL
 * Add OL to selected wysiwyg editor content
 * @exports OL
 * @augments Command
 * @augments WysiwygCommand
 */
var OL = CommandManager.command('wysiwyg',/** @lends OL */{
    name: 'OL',
    keyMap: ['Ctrl-O', 'Ctrl-O'],
    /**
     *  커맨드 핸들러
     *  @param {Squire} editor Squire instance
     */
    exec: function(editor) {
        editor.makeOrderedList();
        editor.focus();
    }
});

module.exports = OL;

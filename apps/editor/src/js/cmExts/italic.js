'use strict';

var CodeMirror = window.CodeMirror;

var italicRegex = /^[\*_][^\*_]*[\*_]$/;
var boldItalicRegex = /^[\*_]{3,}[^\*_]*[\*_]{3,}$/;

function isNeedRemove(selection) {
    return italicRegex.test(selection) || boldItalicRegex.test(selection);
}

function append(selection) {
    return '*' + selection + '*';
}

function remove(selection) {
    return selection.substr(1, selection.length - 2);
}

function expendWithBoldSelection(doc, cursor) {
    var tmpSelection = doc.getSelection();

    doc.setSelection({line: cursor.line, ch: cursor.ch - 3}, {line: cursor.line, ch: cursor.ch + 3});

    if (tmpSelection === '******' || tmpSelection === '______') {
        return tmpSelection;
    } else {
        doc.setSelection(cursor);
    }
}

function expendOnlyBoldSelection(doc, cursor) {
    var tmpSelection = doc.getSelection();

    doc.setSelection({line: cursor.line, ch: cursor.ch - 2}, {line: cursor.line, ch: cursor.ch + 2});

    if (tmpSelection === '****' || tmpSelection === '____') {
        doc.setSelection(cursor);
        return 'only';
    }

    return false;
}

function expendSelection(doc, cursor) {
    var tmpSelection = doc.getSelection();

    doc.setSelection({line: cursor.line, ch: cursor.ch - 1}, {line: cursor.line, ch: cursor.ch + 1});

    if (tmpSelection === '**' || tmpSelection === '__') {
        return tmpSelection;
    } else {
        doc.setSelection(cursor);
    }
}

function setCursorToCenter(doc, cursor, isRemoved) {
    var pos = isRemoved ? -1 : 1;
    doc.setCursor(cursor.line, cursor.ch + pos);
}

var Italic = {
    name: 'Italic',
    type: 'md',
    fn: function bold(cm) {
        if (cm.getOption("disableInput")) {
            return CodeMirror.Pass;
        }

        cm.execCommand('singleSelection');

        var doc = cm.getDoc();
        var cursor = doc.getCursor();
        var selection = doc.getSelection();
        var tmpSelection;
        var isEmpty = !selection;
        var isWithBold = false;

        // if selection is empty, expend selection to detect a syntax
        if (isEmpty) {
            if (cursor.ch > 2) {
                tmpSelection = expendWithBoldSelection(doc, cursor);

                if (tmpSelection) {
                    isWithBold = 'with';
                }
            }

            if (isWithBold !== 'with' && cursor.ch > 1) {
                isWithBold = expendOnlyBoldSelection(doc, cursor);
            }

            if (!isWithBold && cursor.ch > 0) {
                expendSelection(doc, cursor);
                selection = tmpSelection || selection;
            }
        }

        var isRemoved = isNeedRemove(selection);
        var result = isRemoved ? remove(selection) : append(selection);

        console.log(selection);
        console.log(result);

        doc.replaceSelection(result, 'around');

        if (isEmpty) {
            setCursorToCenter(doc, cursor, isRemoved);
        }

        cm.focus();
    },
    keyMap: ['Ctrl-I', 'Cmd-I']
};

module.exports = Italic;

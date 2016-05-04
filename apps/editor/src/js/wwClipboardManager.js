/**
 * @fileoverview Implements wysiwyg editor clipboard manager
 * @author Sungho Kim(sungho-kim@nhnent.com) FE Development Team/NHN Ent.
 */

'use strict';

var domUtils = require('./domUtils');
var WwRangeContentExtractor = require('./wwRangeContentExtractor');

var util = tui.util;

/**
 * WwClipboardManager
 * @exports WwClipboardManager
 * @constructor
 * @class
 * @param {WysiwygEditor} wwe WysiwygEditor instance
 */
function WwClipboardManager(wwe) {
    this.wwe = wwe;

    if (util.browser.msie) {
        this.$hiddenArea = $('<div style="position:absolute;top:0;'
            + 'left:-9999px;height:1px;width:1px;overflow:hidden;" />');
        this.wwe.$editorContainerEl.append(this.$hiddenArea);
    }
}

/**
 * init
 * initialize
 */
WwClipboardManager.prototype.init = function() {
    this._initSquireEvent();
};

/**
 * _initSquireEvent
 * initialize squire events
 */
WwClipboardManager.prototype._initSquireEvent = function() {
    var self = this;

    if (util.browser.msie) {
        this.wwe.getEditor().addEventListener('keydown', function(event) {
            var range;

            //Ctrl + C
            if (event.ctrlKey && event.keyCode === 67) {
                range = self.wwe.getEditor().getSelection().cloneRange();
                range = self._extendRange(range);

                self.copyWithTextarea(range);
            //Ctrl + X
            } else if (event.ctrlKey && event.keyCode === 88) {
                range = self.wwe.getEditor().getSelection().cloneRange();
                range = self._extendRange(range);

                self.copyWithTextarea(range);

                range = self.wwe.insertSelectionMarker(range);
                range.deleteContents();

                setTimeout(function() {
                    self.wwe.restoreSelectionMarker();
                    self.wwe.getEditor()._ensureBottomLine();
                });
            }
        });

        this.wwe.getEditor().addEventListener('willPaste', function(pasteData) {
            pasteData.fragment = self._processFragment(pasteData.fragment);
        });
    } else {
        this.wwe.getEditor().addEventListener('copy', function(clipboardEvent) {
            var range;

            clipboardEvent.preventDefault();

            range = self.wwe.getEditor().getSelection().cloneRange();
            range = self._extendRange(range);

            self.makeClipboardData(range, clipboardEvent);
        });

        this.wwe.getEditor().addEventListener('cut', function(clipboardEvent) {
            var range;

            clipboardEvent.preventDefault();

            range = self.wwe.getEditor().getSelection().cloneRange();
            range = self._extendRange(range);

            self.makeClipboardData(range, clipboardEvent);

            range = self.wwe.insertSelectionMarker(range);
            range.deleteContents();
            self.wwe.restoreSelectionMarker();
            self.wwe.getEditor()._ensureBottomLine();

            self.wwe.postProcessForChange();
        });
    }

    this.wwe.getEditor().addEventListener('paste', function() {
        self.wwe.postProcessForChange();
    });
};

/**
 * _processFragment
 * process fragment if it was from textarea
 * @param {DocumentFragment} fragment frament to process
 * @returns {DocumentFragment} new fragment
 */
WwClipboardManager.prototype._processFragment = function(fragment) {
    var parsedChilds, processedFragment, i, t;

    if (this._latestTextareaContent === fragment.textContent) {
        parsedChilds = $.parseHTML(fragment.textContent);

        processedFragment = document.createDocumentFragment();

        for (i = 0, t = parsedChilds.length; i < t; i += 1) {
            processedFragment.appendChild(parsedChilds[i]);
        }
    }

    return processedFragment || fragment;
};

/**
 * _getContentFromRange
 * get processed contents of range
 * @param {Range} range range of selection
 * @returns {string} processed contents
 */
WwClipboardManager.prototype._getContentFromRange = function(range) {
    var extractor = new WwRangeContentExtractor(this.wwe, range);

    return extractor.getAsString();
};

/**
 * copyWithTextarea
 * copy clipboard using textarea for IEs
 * @param {Range} range range of selection
 */
WwClipboardManager.prototype.copyWithTextarea = function(range) {
    var self = this,
        textarea = $('<textarea />');

    this.$hiddenArea.append(textarea);

    this._latestTextareaContent = this._getContentFromRange(range);
    textarea.val(this._latestTextareaContent);

    textarea.select();

    setTimeout(function() {
        //카피가 끝나면 텍스트 에리어 제거
        textarea.remove();
        //여기서 셀렉션도 복구
        //파폭에선 focus를 다시이동 해줘야함
        self.wwe.getEditor().focus();
        self.wwe.getEditor().setSelection(range);
    }, 0);
};

/**
 * makeClipboardData
 * make clipboard data with range
 * @param {Range} range range of selection
 * @param {ClipboardEvent} clipboardEvent current clipboardEvent
 */
WwClipboardManager.prototype.makeClipboardData = function(range, clipboardEvent) {
    var htmlText = this._getContentFromRange(range);
    clipboardEvent.clipboardData.setData('text/html', htmlText);
};


/**
 * _extendRange
 * extend range if need
 * @param {Range} range to extend
 * @returns {Range} range
 */
WwClipboardManager.prototype._extendRange = function(range) {
    var newBound, boundNext;

    //같지 않은경우를 체크해야한다 같은경우 레인지 확장할때 commonAncestorContainer를 넘어가버림
    //이경우에 스타트와 엔드가 같은 텍스트노드인경우는 텍스트노드만 지우는게 맞다.
    if (range.startContainer !== range.endContainer) {
        if (range.startOffset === 0) {
            newBound = range.startContainer;

            //레인지 확장
            while (newBound.parentNode !== range.commonAncestorContainer
                    && !newBound.previousSibling
                  ) {
                newBound = newBound.parentNode;
            }

            //range단위를 한단계 확장 deleteContents는 start, end에 걸린 컨테이너 자체는 안지운다.
            range.setStart(newBound.parentNode, domUtils.getNodeOffsetOfParent(newBound));
        }

        if (range.endOffset === range.endContainer.length) {
            newBound = range.endContainer;
            boundNext = newBound.nextSibling;

            //레인지 확장
            while (newBound.parentNode !== range.commonAncestorContainer
                    && (!boundNext || (boundNext.tagName === 'BR' && newBound.parentNode.lastChild === boundNext))
                  ) {
                newBound = newBound.parentNode;
            }

            //range단위를 부모래밸로 한단계 확장 deleteContents는 start, end에 걸린 컨테이너 자체는 안지운다.
            range.setEnd(newBound.parentNode, domUtils.getNodeOffsetOfParent(newBound) + 1);
        }
    }

    // commonAncestor를 선택
    if (this._isWholeCommonAncestorContainerSelected(range)) {
        newBound = range.commonAncestorContainer;
        range.setStart(newBound.parentNode, domUtils.getNodeOffsetOfParent(newBound));
        range.setEnd(newBound.parentNode, domUtils.getNodeOffsetOfParent(newBound) + 1);
    }

    return range;
};

/**
 * _isWholeCommonAncestorContainerSelected
 * check if selection has whole commonAncestorContainter
 * 선택된 영역이 commonAncestorContainer의 모든 컨텐츠인치 체크
 * @param {Range} range range of selection
 * @returns {boolean} result
 */
WwClipboardManager.prototype._isWholeCommonAncestorContainerSelected = function(range) {
    return range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        && range.commonAncestorContainer !== this.wwe.$editorContainerEl[0]
        && range.startOffset === 0
        && range.endOffset === range.commonAncestorContainer.childNodes.length
        && range.commonAncestorContainer === range.startContainer
        && range.commonAncestorContainer === range.endContainer;
};

module.exports = WwClipboardManager;

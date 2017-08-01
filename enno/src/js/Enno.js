function Enno() {
    this.source = null;
    this.source_config = null;
    this.sample_id = null;
    this.sample = null;

    this.container = document.getElementById('sample-container');

    // TODO
    // initialise global event listeners
    var that = this;
    this.container.addEventListener('mouseup', function (e) {
        that.selectionHandler(e);
    });
}

Enno.getSelectionRangeWithin = function (element) {
    // taken from: http://jsfiddle.net/UuDpL/2/
    // posted here: https://stackoverflow.com/questions/7991474/calculate-position-of-selected-text-javascript-jquery
    var start = 0, end = 0;
    var sel, range, priorRange;
    if (typeof window.getSelection !== "undefined") {
        range = window.getSelection().getRangeAt(0);
        priorRange = range.cloneRange();
        priorRange.selectNodeContents(element);
        priorRange.setEnd(range.startContainer, range.startOffset);
        start = priorRange.toString().length;
        end = start + range.toString().length;
    } else if (typeof document.selection !== "undefined" &&
        (sel = document.selection).type !== "Control") {
        range = sel.createRange();
        priorRange = document.body.createTextRange();
        priorRange.moveToElementText(element);
        priorRange.setEndPoint("EndToStart", range);
        start = priorRange.text.length;
        end = start + range.text.length;
    }
    return {
        start: start,
        end: end
    };
};

Enno.prototype.showSources = function () {
    // TODO
    // displays modal with all configured data sources
};

Enno.prototype.selectSource = function (source) {
    // TODO
    // sets a selected source and updates variables accordingly
    this.source = source;
};

Enno.prototype.showSamples = function () {
    // TODO
    // displays a modal with all samples of selected data source
};

Enno.prototype.selectSample = function (sample) {
    // TODO
    // sets selected sample, updates variables accordingly and triggers rendering
    //console.log(API.bla());
    var that = this;
    API.getSample(this.source, sample).then(function (result) {
        that.sample_id = sample;
        that.sample = result;
        console.log(result);
        that.renderText();
    })
};

Enno.prototype.renderText = function() {
    this.container.innerHTML = this.getTextAsHtml();
    // TODO draw the rest of the stuff and update listeners
};

Enno.prototype.getTextAsHtml = function () {
    var text = this.sample.text;
    var denotations = this.sample.denotations || [];
    var ret = '';
    var index = buildBoundaryIndex(denotations);

    var boundaries = Object.keys(index).map(Number);
    boundaries.sort(function (a, b) {
        return a - b;
    });

    var cursor = 0;
    boundaries.forEach(function (newCursor) {
        ret += replaceWhitespaces(text.substring(cursor, newCursor));
        cursor = newCursor;
        index[newCursor].forEach(function (reference) {
            if (reference['type'] === 'start') {
                ret += '<denotation ' +
                    'id="deno-' + denotations[reference['di']]['id'] + '" ' +
                    'typ="' + (denotations[reference['di']]['type'] || '') + '">';
            } else {
                ret += '</denotation>';
            }
        });
    });
    ret += replaceWhitespaces(text.substring(cursor, text.length));

    return ret;

    function replaceWhitespaces(snippet) {
        return snippet
            .replace(/ /g, '<span class="special-char">·</span>')
            .replace(/\n/g, '<span class="special-char">⤶</span><br />');
    }

    function buildBoundaryIndex(denotations) {
        var index = {};
        denotations.forEach(function (denotation, i) {
            if (denotation.start in index) index[denotation.start].push({'type': 'start', 'di': i});
            else index[denotation.start] = [{'type': 'start', 'di': i}];
            if (denotation.end in index) index[denotation.end].push({'type': 'end', 'di': i});
            else index[denotation.end] = [{'type': 'end', 'di': i}];
        });
        return index;
    }
};

Enno.prototype.getDenotationForSpan = function (start, end) {
    var ret = {
        'id': null,
        'start': start,
        'end': end,
        'text': this.sample.text.substring(start, end),
        'typ': null,
        'meta': null
    };
    return ret;
    // TODO
    // returns new, if none there, existing one of overlapping?
};

Enno.prototype.addDenotation = function (newDenotation) {
    var that = this;
    return new Promise(function(resolve, reject) {
        API.upsertDenotation(that.source, that.sample_id, newDenotation.start, newDenotation.end, newDenotation.text,
            newDenotation.typ, newDenotation.id, newDenotation.meta).then(function(savedDenotation) {
            that.sample.denotations.push(savedDenotation);
            resolve(savedDenotation);
        }).catch(function(data) {
            console.error('meh.');
            console.error(data);
            reject(data);
        });
    });

};

Enno.prototype.selectionHandler = function (event) {
    // nothing selected, false alarm, return!
    if (!window.getSelection().toString()) return;

    var that = this;
    var range = Enno.getSelectionRangeWithin(this.container);
    var newDenotation = this.getDenotationForSpan(range.start, range.end);

    this.addDenotation(newDenotation).then(function(savedDenotation) {
        that.renderText();
    }).catch(function(data) {
        console.error('meh..');
        console.error(data);
    });
};

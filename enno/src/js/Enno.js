function Enno() {
    this.source = null;
    this.sourceConfig = null;
    this.sourceConfigReverse = null;
    this.sampleID = null;
    this.sample = null;
    this.selectedEndpoint = null;

    this.container = document.getElementById('sample-container');

    // TODO
    // initialise global event listeners
    var that = this;
    this.container.addEventListener('mouseup', function (e) {
        that.eventHandlerSelection(e);
    });
    window.addEventListener('keyup', function(e) {
        if(e.key === 'Escape') that.eventHandlerEndointReset();
    })
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

Enno.removeSelectionRange = function () {
    // taken from https://stackoverflow.com/a/1643608/5904163
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    } else if (document.selection) {
        document.selection.empty();
    }
};

Enno.prototype.showSources = function () {
    // TODO
    // displays modal with all configured data sources
};

Enno.prototype.selectSource = function (source) {
    var that = this;
    return new Promise(function (resolve, reject) {
        API.getConfig(source).then(function (conf) {
            that.source = source;
            that.sourceConfig = conf;
            that.sourceConfigReverse = buildReverseConfig(conf);
            resolve(conf);
        }).catch(function (error) {
            console.error('meh. set conf error');
            console.log(error);
            reject(error);
        })
    });

    function buildReverseConfig(conf) {
        conf = conf.options;
        var ret = {from: {}, to: {}};
        for (var rel in conf.relationTypes) {
            buildList(conf.relationTypes[rel].from, conf.relationTypes[rel].to, rel);
            if (conf.relationTypes[rel].type.indexOf('symmetric') >= 0)
                buildList(conf.relationTypes[rel].to, conf.relationTypes[rel].from, rel);
        }
        return ret;

        function buildList(origins, targets, relation) {
            origins.forEach(function (denoFrom) {
                if (!(denoFrom in ret.from)) ret.from[denoFrom] = {};
                targets.forEach(function (denoTo) {
                    if (!(denoTo in ret.to)) ret.to[denoTo] = {};
                    if (!(denoFrom in ret.to[denoTo])) ret.to[denoTo][denoFrom] = [];
                    if (!(denoTo in ret.from[denoFrom])) ret.from[denoFrom][denoTo] = [];
                    ret.from[denoFrom][denoTo].push(relation);
                    ret.to[denoTo][denoFrom].push(relation);
                });
            });
        }
    }
};

Enno.prototype.showSamples = function () {
    // TODO
    // displays a modal with all samples of selected data source
};

Enno.prototype.selectSample = function (sample) {
    var that = this;
    return new Promise(function (resolve, reject) {
        API.getSample(that.source, sample).then(function (result) {
            that.sampleID = sample;
            that.sample = result;
            that.renderText();
            resolve(result);
        }).catch(function (error) {
            console.error('meh. sample select failed.');
            console.log(error);
            reject(error);
        })
    });
};

Enno.connecionConfig = {
    connector: ['Bezier', {curviness: 100}],
    anchor: ['Top', 'Top'],
    endpoint: ["Dot", {radius: 5}]
};

Enno.prototype.renderText = function () {
    var that = this;
    this.container.innerHTML = this.getTextAsHtml();

    // add jsplumb endpoints
    (this.sample.denotations || []).forEach(function (denotation) {
        var isSource = denotation.type in that.sourceConfigReverse.from;
        var isTarget = denotation.type in that.sourceConfigReverse.to;
        // hint: does not allow untyped denotations to be linked!
        if (isSource || isTarget) {
            var endpoint = jsPlumb.addEndpoint('deno-' + denotation.id, {
                isSource: isSource,
                isTarget: isTarget
            }, Enno.connecionConfig);

            endpoint.bind('click', that.eventHandlerEndpointClick())
        }
    });

    // draw existing relations
    (this.sample.relations || []).forEach(function (relation) {
        jsPlumb.connect({
            source: 'deno-' + relation.from.id,
            target: 'deno-' + relation.to.id
        }, Enno.connecionConfig);
    })
};

Enno.prototype.eventHandlerEndpointClick = function () {
    var that = this;
    return function(info) {
        if (!!that.selectedEndpoint) {
            that.eventHandlerEndointReset();
        } else {
            that.selectedEndpoint = info;
            that.selectedEndpoint.getElement().classList.add('selected');
        }
    };
};

Enno.prototype.eventHandlerEndointReset = function () {
    this.selectedEndpoint.getElement().classList.remove('selected');
    this.selectedEndpoint = null;
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
            var id = denotations[reference['di']]['id'];
            var type = denotations[reference['di']]['type'] || '';
            if (reference['type'] === 'start') {
                ret += '<denotation id="deno-' + id + '" type="' + type + '">';
            } else {
                ret += '<!-- /deno-' + id + ' (' + type + ') --></denotation>';
            }
        });
    });
    ret += replaceWhitespaces(text.substring(cursor, text.length));

    return ret;

    function replaceWhitespaces(snippet) {
        return snippet
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/ /g, '<span class="special-char">·</span>')
            .replace(/\n/g, '<span class="special-char">⤶</span><br />');
    }

    function buildBoundaryIndex(denotations) {
        var index = {};
        denotations.forEach(function (denotation, i) {
            if (!(denotation.start in index)) index[denotation.start] = [];
            if (!(denotation.end in index)) index[denotation.end] = [];

            index[denotation.start].push({'type': 'start', 'di': i, 'end': denotation.end});
            index[denotation.end].push({'type': 'end', 'di': i});
        });
        for (var boundary in index) {
            index[boundary].sort(function (a, b) {
                if (a.type === 'start' && b.type === 'start') return b.end - a.end;
                if (a.type === 'end' && b.type === 'start') return 1;
                if (a.type === 'start' && b.type === 'end') return -1;
                return 0;
            });
        }
        return index;
    }
};

Enno.prototype.getDenotationForSpan = function (start, end) {
    var ret = {
        'id': null,
        'start': start,
        'end': end,
        'text': this.sample.text.substring(start, end),
        'type': null,
        'meta': null
    };
    return ret;
    // TODO
    // returns new, if none there, existing one of overlapping?
};

Enno.prototype.addDenotation = function (newDenotation) {
    var that = this;
    return new Promise(function (resolve, reject) {
        API.upsertDenotation(that.source, that.sampleID, newDenotation.start, newDenotation.end, newDenotation.text,
            newDenotation.type, newDenotation.id, newDenotation.meta).then(function (savedDenotation) {
            that.sample.denotations.push(savedDenotation);
            resolve(savedDenotation);
        }).catch(function (data) {
            console.error('meh.');
            console.error(data);
            reject(data);
        });
    });

};

Enno.prototype.eventHandlerSelection = function (event) {
    // nothing selected, false alarm, return!
    if (!window.getSelection().toString()) return;

    var that = this;
    var range = Enno.getSelectionRangeWithin(this.container);
    var newDenotation = this.getDenotationForSpan(range.start, range.end);

    SelectionModal(this.sourceConfig.options.denotationTypes, event).then(function (type) {
        newDenotation.type = type;
        that.addDenotation(newDenotation).then(function (savedDenotation) {
            that.renderText();
        }).catch(function (data) {
            console.error('meh. type chosen fail');
            console.error(data);
        });
    }).catch(function (data) {
        console.log('reject selection')
    })
};

function SelectionModal(options, event) {
    return new Promise(function (resolve, reject) {
        var modal = document.getElementById('selection-modal');
        var list = modal.getElementsByTagName('ul')[0];
        // reset list
        list.innerHTML = '';

        options.forEach(function (option) {
            var li = document.createElement('LI');
            li.appendChild(document.createTextNode(option));
            li.addEventListener('click', function (e) {
                done(this.innerHTML, true);
            });
            list.appendChild(li);
        });

        var keylistener = window.addEventListener('keyup', function (e) {
            switch (e.key) {
                case 'Escape':
                    done(undefined, false);
                    break;
                default:
                    return;
            }
        }, true);

        modal.style.top = Math.min(event.clientY, window.innerHeight-400)+'px';
        modal.style.left = Math.min(event.clientX, window.innerWidth-300)+'px';
        modal.style.display = 'block';

        function done(data, successful) {
            modal.style.display = 'none';
            window.removeEventListener('keyup', keylistener);
            Enno.removeSelectionRange();
            if (successful) resolve(data);
            else reject(data);
        }
    });
}
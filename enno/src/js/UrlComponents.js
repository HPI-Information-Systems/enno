/**
 * This module parses the url wih parameters with respective values for easy access.
 * Taken from https://github.com/TimRepke/registration-system/blob/2e442a56efca78b113d19eaa6804bcbf32d2e5c3/registration-system/view/js/api.js
 */
var UrlComponents = {
    decomposed: null,
    getParams: function () {
        if (this.decomposed) return this.decomposed;

        var query = location.search.substr(1);
        this.decomposed = decomposer(query);
        return this.decomposed;

        function decomposer(q) {
            // taken from http://jsperf.com/querystring-with-javascript
            return (function (a) {
                if (a === "") return {};
                var b = {};
                for (var i = 0; i < a.length; ++i) {
                    var p = a[i].split('=');
                    if (p.length !== 2) continue;
                    b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
                }
                return b;
            })(q.split("&"));
        }
    },
    isSet: function (param) {
        var tmp = this.getParams();
        return tmp && param in tmp;
    },
    getValueOf: function (param) {
        return this.getParams()[param];
    }
};
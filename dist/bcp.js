(function (win) {
    'use strict';
    if (win.BCP && 'function' === typeof win.BCP.prelude) return win.BCP.prelude;
    var setImmediate = win.requestAnimationFrame || win.setImmediate || function (fn) {
        return setTimeout(fn, 1);
    };
    //var clearImmediate = win.cancelAnimationFrame || win.clearImmediate || win.clearTimeout;
    win.BCP = { prelude: prelude };

    var loadedLibs = 0;
    var _cache = BCP.cache = {};
    var _modules = BCP.modules = {};
    ;(function () { this.QAS = (function (win) {
    /* asynchronous function queuing script
     * http://stackoverflow.com/questions/6963779/whats-the-name-of-google-analytics-async-design-pattern-and-where-is-it-used
     * usage:
     * QAS(function (win, doc, body) {
     *   // do something with 3rd part libs
     * }, window, document, document.body);
     *
     * then in you 3rd part libs ending, add:
     * QAS.ready();
     */

    var setImmediate = win.requestAnimationFrame || win.setImmediate || function (fn) {
            return setTimeout(fn, 1);
        };
    //var clearImmediate = win.cancelAnimationFrame || win.clearImmediate || win.clearTimeout;

    var queue = [];
    var loaded;
    var slice = Array.prototype.slice;
    var QAS = function (cb) {
        var args = slice.call(arguments, 1);
        if (loaded) run(cb, args);
        else queue.push([cb, args]);
        return QAS;
    }
    QAS.sync = function (cb) {
        cb.sync = true;
        return QAS.apply(null, arguments);
    }
    QAS.ready = ready;
    QAS.sync.ready = ready;
    function ready() {
        loaded = true;
        var pair;
        while ((pair = queue.shift())) {
            run(pair[0], pair[1]);
        }
    }
    function run(cb, args) {
        if (typeof cb != 'function') return;
        cb.sync
            ? cb.apply(win, args)
            : setImmediate(function () {
                cb.apply(win, args);
            });
    }
    return QAS;

}(this));
 }.call(BCP));
    var QAS = BCP.QAS;

    function mergeModules(modules) {
        modules = modules || {};
        for (var k in modules) {
            if (modules.hasOwnProperty(k)) {
                var sk = (k[0] === '/') ? k : '/' + k; // fix for browserify external()
                if (!(sk in _modules)) {
                    _modules[sk] = modules[k];
                }
            }
        }
    }

    function maybeReady() {
        loadedLibs += 1;
        console.log('mr');
        setImmediate(function () {
            if (loadedLibs >= document.querySelectorAll('script[data-common]').length) {
                console.log('ready');
                QAS.ready();
            }
        });
    }

    function prelude(modules, cache, entry) {
        mergeModules(modules)
        if (!entry || !entry.length) return maybeReady();
        QAS(function (modules, cache, entry) {
            function require(name) {
                if (!cache[name]) {
                    if (!modules[name]) {
                        // 因为现在和之前加载的 modules 都在这了，直接返回找不到
                        var err = new Error('Cannot find module \'' +
                            name +
                            '\'');
                        err.code = 'MODULE_NOT_FOUND';
                        throw err;
                    }
                    var m = cache[name] = {
                        exports: {}
                    };
                    modules[name][0].call(m.exports, function (x) {
                        var id = modules[name][1][x];
                        return require(id ? id : '/' + x); // fix for browserify external()
                    }, m, m.exports,prelude,modules,cache,entry);
                }
                return cache[name].exports;
            }
            for (var i = 0; i < entry.length; i++) {
                require(entry[i]);
            }
        }, _modules, _cache, entry); // 使用全局的 cache 和 modules
    }

    return prelude;
}(this))
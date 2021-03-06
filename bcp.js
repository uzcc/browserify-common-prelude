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
    ;(function () { '{QAS}' }.call(BCP));
    var QAS = BCP.QAS;

    function mergeModules(modules) {
        modules = modules || {};
        for (var k in modules) {
            if (modules.hasOwnProperty(k)) {
                if (!(k in _modules)) {
                    _modules[k] = modules[k];
                    if (k[0] !== '/') _modules['/' + k] = modules[k]; // fix for browserify external()
                }
            }
        }
    }

    function maybeReady() {
        loadedLibs += 1;
        setImmediate(function () {
            if (loadedLibs >= document.querySelectorAll('script[data-common]').length) {
                QAS.ready();
            }
        });
    }

    function prelude(modules, cache, entries) {
        mergeModules(modules)
        if (!entries || !entries.length) {
            maybeReady();
        } else {
            var entry;
            QAS(function (entries) {
                while ((entry = entries.shift())) {
                    require(entry);
                }
            }, entries);
        }
        return require;
        function require(name) {
            if (!QAS.loaded) {
                throw new Error('external libs not ready!');
            }
            if (!_cache[name]) {
                if (!_modules[name]) {
                    // 因为现在和之前加载的 modules 都在这了，直接返回找不到
                    var err = new Error('Cannot find module \'' +
                        name +
                        '\'');
                    err.code = 'MODULE_NOT_FOUND';
                    throw err;
                }
                var m = _cache[name] = {
                    exports: {}
                };
                _modules[name][0].call(m.exports, function (x) {
                    var id = _modules[name][1][x];
                    return require(id ? id : '/' + x); // fix for browserify external()
                }, m, m.exports,prelude,_modules,_cache,entries);
            }
            return _cache[name].exports;
        }
    }

    return prelude;
}(this))

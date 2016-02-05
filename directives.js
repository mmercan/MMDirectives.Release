angular.module('data', []);
angular.module('component', []);
angular.module('directives', []);
angular.module('directives').controller('mmPagerSourceController', ['$scope', '$attrs', '$parse', "$filter", function ($scope, $attrs, $parse, $filter) {
    var self = this,
        ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
        setNumPages = $attrs.numPages ? $parse($attrs.numPages).assign : angular.noop;

    this.init = function (ngModelCtrl_, config) {
        ngModelCtrl = ngModelCtrl_;
        this.config = config;

        ngModelCtrl.$render = function () {
            self.render();
        };

        if ($attrs.itemsPerPage) {
            $scope.$parent.$watch($parse($attrs.itemsPerPage), function (value) {
                self.itemsPerPage = parseInt(value, 10);
                $scope.totalPages = self.calculateTotalPages();
                $scope.setResults($scope.page, self.itemsPerPage, $scope.itemssource, $scope.filter, $scope.sort, $scope.descending)

            });
        } else {
            this.itemsPerPage = config.itemsPerPage;
        }
    };

    this.calculateTotalPages = function () {
        var totalPages = this.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / this.itemsPerPage);
        return Math.max(totalPages || 0, 1);
    };

    this.render = function () {
        $scope.page = parseInt(ngModelCtrl.$viewValue, 10) || 1;
    };

    $scope.selectPage = function (page) {
        if ($scope.page !== page && page > 0 && page <= $scope.totalPages) {
            ngModelCtrl.$setViewValue(page);
            $scope.setResults(page, self.itemsPerPage, $scope.itemssource, $scope.filter, $scope.sort, $scope.descending)
            ngModelCtrl.$render();
        }
    };

    $scope.getText = function (key) {
        return $scope[key + 'Text'] || self.config[key + 'Text'];
    };
    $scope.noPrevious = function () {
        return $scope.page === 1;
    };
    $scope.noNext = function () {
        return $scope.page === $scope.totalPages;
    };

    $scope.$watch('totalItems', function () {
        $scope.totalPages = self.calculateTotalPages();
    });

    $scope.$watchCollection('filter', function () {
        $scope.totalPages = self.calculateTotalPages();
        $scope.setResults($scope.page, self.itemsPerPage, $scope.itemssource, $scope.filter, $scope.sort, $scope.descending)
    });

    $scope.$watchCollection('sort', function () {
        $scope.totalPages = self.calculateTotalPages();
        $scope.setResults($scope.page, self.itemsPerPage, $scope.itemssource, $scope.filter, $scope.sort, $scope.descending)
    });

    $scope.$watchCollection('descending', function () {
        $scope.totalPages = self.calculateTotalPages();
        $scope.setResults($scope.page, self.itemsPerPage, $scope.itemssource, $scope.filter, $scope.sort, $scope.descending)
    });

    $scope.$watch('totalPages', function (value) {
        setNumPages($scope.$parent, value); // Readonly variable

        if ($scope.page > value) {
            $scope.selectPage(value);
        } else {
            ngModelCtrl.$render();
        }
    });

    $scope.$watch("itemssource", function (newvalue, oldvalue) {
        if ($scope.itemssource && self.itemsPerPage && $scope.itemssource.length && $scope.page) {
            $scope.setResults($scope.page, self.itemsPerPage, $scope.itemssource, $scope.filter, $scope.sort, $scope.descending)
        };
    });

    $scope.setResults = function (pagenumber, itemsPerPage, itemssource, filter, sort, descending) {
        if (pagenumber && itemssource && itemssource.length && itemsPerPage) {
            var filteredData = {};
            if (filter) {
                filteredData = $filter('filter')($scope.itemssource, $scope.filter);
            } else {
                filteredData = itemssource;
            }

            if (sort) {
                if ($scope.descending) {
                    filteredData = $filter('orderBy')(filteredData, $scope.sort, true);
                } else {
                    filteredData = $filter('orderBy')(filteredData, $scope.sort);
                }

            }

            $scope.totalItems = filteredData.length;
            var from = (pagenumber - 1) * itemsPerPage;
            var to = pagenumber * itemsPerPage
            $scope.totalPages = self.calculateTotalPages();
            $scope.results = filteredData.slice(from, to)
        }
    };
}])

.constant('pagerSourceConfig', {
    itemsPerPage: 10,
    boundaryLinks: true,
    directionLinks: true,
    firstText: '<<',
    previousText: '<',
    nextText: '>',
    lastText: '>>',
    rotate: false,
    maxSize: 10,
})

.directive('pagerSource', ['$parse', 'pagerSourceConfig', "$filter", function ($parse, pagerSourceConfig, $filter) {
    return {
        restrict: 'EA',
        scope: {
            firstText: '@',
            previousText: '@',
            nextText: '@',
            lastText: '@',
            itemssource: '=',
            filter: '=',
            sort: '=',
            descending: '=',
            results: '=',
        },
        require: ['pagerSource', '?ngModel'],
        controller: 'mmPagerSourceController',
        template: '<ul class="pagination">' +
        '<li ng-if="boundaryLinks" ng-class="{disabled: noPrevious()}"><a href ng-click="selectPage(1)">{{getText("first")}}</a></li>' +
        '<li ng-if="directionLinks" ng-class="{disabled: noPrevious()}"><a href ng-click="selectPage(page - 1)">{{getText("previous")}}</a></li>' +
        '<li ng-repeat="page in pages track by $index" ng-class="{active: page.active}"><a href ng-click="selectPage(page.number)">{{page.text}}</a></li>' +
        '<li ng-if="directionLinks" ng-class="{disabled: noNext()}"><a href ng-click="selectPage(page + 1)">{{getText("next")}}</a></li>' +
        '<li ng-if="boundaryLinks" ng-class="{disabled: noNext()}"><a href ng-click="selectPage(totalPages)">{{getText("last")}}</a></li>' +
        '</ul>',

        //templateUrl: '/App/templates/pagination/pagination.html',
        replace: true,
        link: function (scope, element, attrs, ctrls) {
            var pagerSourceCtrl = ctrls[0], ngModelCtrl = ctrls[1];

            if (!ngModelCtrl) {
                return; // do nothing if no ng-model
            }

            // Setup configuration parameters
            var maxSize = angular.isDefined(attrs.maxSize) ? scope.$parent.$eval(attrs.maxSize) : pagerSourceConfig.maxSize,
                rotate = angular.isDefined(attrs.rotate) ? scope.$parent.$eval(attrs.rotate) : pagerSourceConfig.rotate;
            scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : pagerSourceConfig.boundaryLinks;
            scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : pagerSourceConfig.directionLinks;

            pagerSourceCtrl.init(ngModelCtrl, pagerSourceConfig);

            if (attrs.maxSize) {
                scope.$parent.$watch($parse(attrs.maxSize), function (value) {
                    maxSize = parseInt(value, 10);
                    pagerSourceCtrl.render();
                });
            }

            // Create page object used in template
            function makePage(number, text, isActive) {
                return {
                    number: number,
                    text: text,
                    active: isActive
                };
            }

            function getPages(currentPage, totalPages) {
                var pages = [];

                // Default page limits
                var startPage = 1, endPage = totalPages;
                var isMaxSized = (angular.isDefined(maxSize) && maxSize < totalPages);

                // recompute if maxSize
                if (isMaxSized) {
                    if (rotate) {
                        // Current page is displayed in the middle of the visible ones
                        startPage = Math.max(currentPage - Math.floor(maxSize / 2), 1);
                        endPage = startPage + maxSize - 1;

                        // Adjust if limit is exceeded
                        if (endPage > totalPages) {
                            endPage = totalPages;
                            startPage = endPage - maxSize + 1;
                        }
                    } else {
                        // Visible pages are paginated with maxSize
                        startPage = ((Math.ceil(currentPage / maxSize) - 1) * maxSize) + 1;

                        // Adjust last page if limit is exceeded
                        endPage = Math.min(startPage + maxSize - 1, totalPages);
                    }
                }

                // Add page number links
                for (var number = startPage; number <= endPage; number++) {
                    var page = makePage(number, number, number === currentPage);
                    pages.push(page);
                }

                // Add links to move between page sets
                if (isMaxSized && !rotate) {
                    if (startPage > 1) {
                        var previousPageSet = makePage(startPage - 1, '...', false);
                        pages.unshift(previousPageSet);
                    }

                    if (endPage < totalPages) {
                        var nextPageSet = makePage(endPage + 1, '...', false);
                        pages.push(nextPageSet);
                    }
                }

                return pages;
            }

            var originalRender = pagerSourceCtrl.render;
            pagerSourceCtrl.render = function () {
                originalRender();
                if (scope.page > 0 && scope.page <= scope.totalPages) {
                    scope.pages = getPages(scope.page, scope.totalPages);
                }
            };
        }
    };
}]);




//.controller('PaginationController', ['$scope', '$attrs', '$parse', function ($scope, $attrs, $parse) {
//    var self = this,
//        ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
//        setNumPages = $attrs.numPages ? $parse($attrs.numPages).assign : angular.noop;

//    this.init = function (ngModelCtrl_, config) {
//        ngModelCtrl = ngModelCtrl_;
//        this.config = config;

//        ngModelCtrl.$render = function () {
//            self.render();
//        };

//        if ($attrs.itemsPerPage) {
//            $scope.$parent.$watch($parse($attrs.itemsPerPage), function (value) {
//                self.itemsPerPage = parseInt(value, 10);
//                $scope.totalPages = self.calculateTotalPages();
//            });
//        } else {
//            this.itemsPerPage = config.itemsPerPage;
//        }
//    };

//    this.calculateTotalPages = function () {
//        var totalPages = this.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / this.itemsPerPage);
//        return Math.max(totalPages || 0, 1);
//    };

//    this.render = function () {
//        $scope.page = parseInt(ngModelCtrl.$viewValue, 10) || 1;
//    };

//    $scope.selectPage = function (page) {
//        if ($scope.page !== page && page > 0 && page <= $scope.totalPages) {
//            ngModelCtrl.$setViewValue(page);
//            ngModelCtrl.$render();
//        }
//    };

//    $scope.getText = function (key) {
//        return $scope[key + 'Text'] || self.config[key + 'Text'];
//    };
//    $scope.noPrevious = function () {
//        return $scope.page === 1;
//    };
//    $scope.noNext = function () {
//        return $scope.page === $scope.totalPages;
//    };

//    $scope.$watch('totalItems', function () {
//        $scope.totalPages = self.calculateTotalPages();
//    });

//    $scope.$watch('totalPages', function (value) {
//        setNumPages($scope.$parent, value); // Readonly variable

//        if ($scope.page > value) {
//            $scope.selectPage(value);
//        } else {
//            ngModelCtrl.$render();
//        }
//    });
//}])

//.constant('paginationConfig', {
//    itemsPerPage: 10,
//    boundaryLinks: false,
//    directionLinks: true,
//    firstText: 'First',
//    previousText: 'Previous',
//    nextText: 'Next',
//    lastText: 'Last',
//    rotate: true
//})
//.directive('pagination', ['$parse', 'pagerSourceConfig', function ($parse, paginationConfig) {
//    return {
//        restrict: 'EA',
//        scope: {
//            totalItems: '=',
//            firstText: '@',
//            previousText: '@',
//            nextText: '@',
//            lastText: '@'
//        },
//        require: ['pagination', '?ngModel'],
//        controller: 'PaginationController',
//        template: '<ul class="pagination">' +
//    '<li ng-if="boundaryLinks" ng-class="{disabled: noPrevious()}"><a href ng-click="selectPage(1)">{{getText("first")}}</a></li>' +
//    '<li ng-if="directionLinks" ng-class="{disabled: noPrevious()}"><a href ng-click="selectPage(page - 1)">{{getText("previous")}}</a></li>' +
//    '<li ng-repeat="page in pages track by $index" ng-class="{active: page.active}"><a href ng-click="selectPage(page.number)">{{page.text}}</a></li>' +
//    '<li ng-if="directionLinks" ng-class="{disabled: noNext()}"><a href ng-click="selectPage(page + 1)">{{getText("next")}}</a></li>' +
//    '<li ng-if="boundaryLinks" ng-class="{disabled: noNext()}"><a href ng-click="selectPage(totalPages)">{{getText("last")}}</a></li>' +
//    '</ul>',
//        //templateUrl: 'template/pagination/pagination.html',
//        replace: true,
//        link: function (scope, element, attrs, ctrls) {
//            var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];

//            if (!ngModelCtrl) {
//                return; // do nothing if no ng-model
//            }

//            // Setup configuration parameters
//            var maxSize = angular.isDefined(attrs.maxSize) ? scope.$parent.$eval(attrs.maxSize) : paginationConfig.maxSize,
//                rotate = angular.isDefined(attrs.rotate) ? scope.$parent.$eval(attrs.rotate) : paginationConfig.rotate;
//            scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : paginationConfig.boundaryLinks;
//            scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : paginationConfig.directionLinks;

//            paginationCtrl.init(ngModelCtrl, paginationConfig);

//            if (attrs.maxSize) {
//                scope.$parent.$watch($parse(attrs.maxSize), function (value) {
//                    maxSize = parseInt(value, 10);
//                    paginationCtrl.render();
//                });
//            }

//            // Create page object used in template
//            function makePage(number, text, isActive) {
//                return {
//                    number: number,
//                    text: text,
//                    active: isActive
//                };
//            }

//            function getPages(currentPage, totalPages) {
//                var pages = [];

//                // Default page limits
//                var startPage = 1, endPage = totalPages;
//                var isMaxSized = (angular.isDefined(maxSize) && maxSize < totalPages);

//                // recompute if maxSize
//                if (isMaxSized) {
//                    if (rotate) {
//                        // Current page is displayed in the middle of the visible ones
//                        startPage = Math.max(currentPage - Math.floor(maxSize / 2), 1);
//                        endPage = startPage + maxSize - 1;

//                        // Adjust if limit is exceeded
//                        if (endPage > totalPages) {
//                            endPage = totalPages;
//                            startPage = endPage - maxSize + 1;
//                        }
//                    } else {
//                        // Visible pages are paginated with maxSize
//                        startPage = ((Math.ceil(currentPage / maxSize) - 1) * maxSize) + 1;

//                        // Adjust last page if limit is exceeded
//                        endPage = Math.min(startPage + maxSize - 1, totalPages);
//                    }
//                }

//                // Add page number links
//                for (var number = startPage; number <= endPage; number++) {
//                    var page = makePage(number, number, number === currentPage);
//                    pages.push(page);
//                }

//                // Add links to move between page sets
//                if (isMaxSized && !rotate) {
//                    if (startPage > 1) {
//                        var previousPageSet = makePage(startPage - 1, '...', false);
//                        pages.unshift(previousPageSet);
//                    }

//                    if (endPage < totalPages) {
//                        var nextPageSet = makePage(endPage + 1, '...', false);
//                        pages.push(nextPageSet);
//                    }
//                }

//                return pages;
//            }

//            var originalRender = paginationCtrl.render;
//            paginationCtrl.render = function () {
//                originalRender();
//                if (scope.page > 0 && scope.page <= scope.totalPages) {
//                    scope.pages = getPages(scope.page, scope.totalPages);
//                }
//            };
//        }
//    };
//}])

/*!jQuery Knob*/
/**
 * Downward compatible, touchable dial
 *
 * Version: 1.2.12
 * Requires: jQuery v1.7+
 *
 * Copyright (c) 2012 Anthony Terrien
 * Under MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Thanks to vor, eskimoblood, spiffistan, FabrizioC
 */
(function (e) { if (typeof define === "function" && define.amd) { define(["jquery"], e) } else { e(jQuery) } })(function (e) { "use strict"; var t = {}, n = Math.max, r = Math.min; t.c = {}; t.c.d = e(document); t.c.t = function (e) { return e.originalEvent.touches.length - 1 }; t.o = function () { var n = this; this.o = null; this.$ = null; this.i = null; this.g = null; this.v = null; this.cv = null; this.x = 0; this.y = 0; this.w = 0; this.h = 0; this.$c = null; this.c = null; this.t = 0; this.isInit = false; this.fgColor = null; this.pColor = null; this.dH = null; this.cH = null; this.eH = null; this.rH = null; this.scale = 1; this.relative = false; this.relativeWidth = false; this.relativeHeight = false; this.$div = null; this.run = function () { var t = function (e, t) { var r; for (r in t) { n.o[r] = t[r] } n._carve().init(); n._configure()._draw() }; if (this.$.data("kontroled")) return; this.$.data("kontroled", true); this.extend(); this.o = e.extend({ min: this.$.data("min") !== undefined ? this.$.data("min") : 0, max: this.$.data("max") !== undefined ? this.$.data("max") : 100, stopper: true, readOnly: this.$.data("readonly") || this.$.attr("readonly") === "readonly", cursor: this.$.data("cursor") === true && 30 || this.$.data("cursor") || 0, thickness: this.$.data("thickness") && Math.max(Math.min(this.$.data("thickness"), 1), .01) || .35, lineCap: this.$.data("linecap") || "butt", width: this.$.data("width") || 200, height: this.$.data("height") || 200, displayInput: this.$.data("displayinput") == null || this.$.data("displayinput"), displayPrevious: this.$.data("displayprevious"), fgColor: this.$.data("fgcolor") || "#87CEEB", inputColor: this.$.data("inputcolor"), font: this.$.data("font") || "Arial", fontWeight: this.$.data("font-weight") || "bold", inline: false, step: this.$.data("step") || 1, rotation: this.$.data("rotation"), draw: null, change: null, cancel: null, release: null, format: function (e) { return e }, parse: function (e) { return parseFloat(e) } }, this.o); this.o.flip = this.o.rotation === "anticlockwise" || this.o.rotation === "acw"; if (!this.o.inputColor) { this.o.inputColor = this.o.fgColor } if (this.$.is("fieldset")) { this.v = {}; this.i = this.$.find("input"); this.i.each(function (t) { var r = e(this); n.i[t] = r; n.v[t] = n.o.parse(r.val()); r.bind("change blur", function () { var e = {}; e[t] = r.val(); n.val(n._validate(e)) }) }); this.$.find("legend").remove() } else { this.i = this.$; this.v = this.o.parse(this.$.val()); this.v === "" && (this.v = this.o.min); this.$.bind("change blur", function () { n.val(n._validate(n.o.parse(n.$.val()))) }) } !this.o.displayInput && this.$.hide(); this.$c = e(document.createElement("canvas")).attr({ width: this.o.width, height: this.o.height }); this.$div = e('<div style="' + (this.o.inline ? "display:inline;" : "") + "width:" + this.o.width + "px;height:" + this.o.height + "px;" + '"></div>'); this.$.wrap(this.$div).before(this.$c); this.$div = this.$.parent(); if (typeof G_vmlCanvasManager !== "undefined") { G_vmlCanvasManager.initElement(this.$c[0]) } this.c = this.$c[0].getContext ? this.$c[0].getContext("2d") : null; if (!this.c) { throw { name: "CanvasNotSupportedException", message: "Canvas not supported. Please use excanvas on IE8.0.", toString: function () { return this.name + ": " + this.message } } } this.scale = (window.devicePixelRatio || 1) / (this.c.webkitBackingStorePixelRatio || this.c.mozBackingStorePixelRatio || this.c.msBackingStorePixelRatio || this.c.oBackingStorePixelRatio || this.c.backingStorePixelRatio || 1); this.relativeWidth = this.o.width % 1 !== 0 && this.o.width.indexOf("%"); this.relativeHeight = this.o.height % 1 !== 0 && this.o.height.indexOf("%"); this.relative = this.relativeWidth || this.relativeHeight; this._carve(); if (this.v instanceof Object) { this.cv = {}; this.copy(this.v, this.cv) } else { this.cv = this.v } this.$.bind("configure", t).parent().bind("configure", t); this._listen()._configure()._xy().init(); this.isInit = true; this.$.val(this.o.format(this.v)); this._draw(); return this }; this._carve = function () { if (this.relative) { var e = this.relativeWidth ? this.$div.parent().width() * parseInt(this.o.width) / 100 : this.$div.parent().width(), t = this.relativeHeight ? this.$div.parent().height() * parseInt(this.o.height) / 100 : this.$div.parent().height(); this.w = this.h = Math.min(e, t) } else { this.w = this.o.width; this.h = this.o.height } this.$div.css({ width: this.w + "px", height: this.h + "px" }); this.$c.attr({ width: this.w, height: this.h }); if (this.scale !== 1) { this.$c[0].width = this.$c[0].width * this.scale; this.$c[0].height = this.$c[0].height * this.scale; this.$c.width(this.w); this.$c.height(this.h) } return this }; this._draw = function () { var e = true; n.g = n.c; n.clear(); n.dH && (e = n.dH()); e !== false && n.draw() }; this._touch = function (e) { var r = function (e) { var t = n.xy2val(e.originalEvent.touches[n.t].pageX, e.originalEvent.touches[n.t].pageY); if (t == n.cv) return; if (n.cH && n.cH(t) === false) return; n.change(n._validate(t)); n._draw() }; this.t = t.c.t(e); r(e); t.c.d.bind("touchmove.k", r).bind("touchend.k", function () { t.c.d.unbind("touchmove.k touchend.k"); n.val(n.cv) }); return this }; this._mouse = function (e) { var r = function (e) { var t = n.xy2val(e.pageX, e.pageY); if (t == n.cv) return; if (n.cH && n.cH(t) === false) return; n.change(n._validate(t)); n._draw() }; r(e); t.c.d.bind("mousemove.k", r).bind("keyup.k", function (e) { if (e.keyCode === 27) { t.c.d.unbind("mouseup.k mousemove.k keyup.k"); if (n.eH && n.eH() === false) return; n.cancel() } }).bind("mouseup.k", function (e) { t.c.d.unbind("mousemove.k mouseup.k keyup.k"); n.val(n.cv) }); return this }; this._xy = function () { var e = this.$c.offset(); this.x = e.left; this.y = e.top; return this }; this._listen = function () { if (!this.o.readOnly) { this.$c.bind("mousedown", function (e) { e.preventDefault(); n._xy()._mouse(e) }).bind("touchstart", function (e) { e.preventDefault(); n._xy()._touch(e) }); this.listen() } else { this.$.attr("readonly", "readonly") } if (this.relative) { e(window).resize(function () { n._carve().init(); n._draw() }) } return this }; this._configure = function () { if (this.o.draw) this.dH = this.o.draw; if (this.o.change) this.cH = this.o.change; if (this.o.cancel) this.eH = this.o.cancel; if (this.o.release) this.rH = this.o.release; if (this.o.displayPrevious) { this.pColor = this.h2rgba(this.o.fgColor, "0.4"); this.fgColor = this.h2rgba(this.o.fgColor, "0.6") } else { this.fgColor = this.o.fgColor } return this }; this._clear = function () { this.$c[0].width = this.$c[0].width }; this._validate = function (e) { var t = ~~((e < 0 ? -.5 : .5) + e / this.o.step) * this.o.step; return Math.round(t * 100) / 100 }; this.listen = function () { }; this.extend = function () { }; this.init = function () { }; this.change = function (e) { }; this.val = function (e) { }; this.xy2val = function (e, t) { }; this.draw = function () { }; this.clear = function () { this._clear() }; this.h2rgba = function (e, t) { var n; e = e.substring(1, 7); n = [parseInt(e.substring(0, 2), 16), parseInt(e.substring(2, 4), 16), parseInt(e.substring(4, 6), 16)]; return "rgba(" + n[0] + "," + n[1] + "," + n[2] + "," + t + ")" }; this.copy = function (e, t) { for (var n in e) { t[n] = e[n] } } }; t.Dial = function () { t.o.call(this); this.startAngle = null; this.xy = null; this.radius = null; this.lineWidth = null; this.cursorExt = null; this.w2 = null; this.PI2 = 2 * Math.PI; this.extend = function () { this.o = e.extend({ bgColor: this.$.data("bgcolor") || "#EEEEEE", angleOffset: this.$.data("angleoffset") || 0, angleArc: this.$.data("anglearc") || 360, inline: true }, this.o) }; this.val = function (e, t) { if (null != e) { e = this.o.parse(e); if (t !== false && e != this.v && this.rH && this.rH(e) === false) { return } this.cv = this.o.stopper ? n(r(e, this.o.max), this.o.min) : e; this.v = this.cv; this.$.val(this.o.format(this.v)); this._draw() } else { return this.v } }; this.xy2val = function (e, t) { var i, s; i = Math.atan2(e - (this.x + this.w2), -(t - this.y - this.w2)) - this.angleOffset; if (this.o.flip) { i = this.angleArc - i - this.PI2 } if (this.angleArc != this.PI2 && i < 0 && i > -.5) { i = 0 } else if (i < 0) { i += this.PI2 } s = i * (this.o.max - this.o.min) / this.angleArc + this.o.min; this.o.stopper && (s = n(r(s, this.o.max), this.o.min)); return s }; this.listen = function () { var t = this, i, s, o = function (e) { e.preventDefault(); var o = e.originalEvent, u = o.detail || o.wheelDeltaX, a = o.detail || o.wheelDeltaY, f = t._validate(t.o.parse(t.$.val())) + (u > 0 || a > 0 ? t.o.step : u < 0 || a < 0 ? -t.o.step : 0); f = n(r(f, t.o.max), t.o.min); t.val(f, false); if (t.rH) { clearTimeout(i); i = setTimeout(function () { t.rH(f); i = null }, 100); if (!s) { s = setTimeout(function () { if (i) t.rH(f); s = null }, 200) } } }, u, a, f = 1, l = { 37: -t.o.step, 38: t.o.step, 39: t.o.step, 40: -t.o.step }; this.$.bind("keydown", function (i) { var s = i.keyCode; if (s >= 96 && s <= 105) { s = i.keyCode = s - 48 } u = parseInt(String.fromCharCode(s)); if (isNaN(u)) { s !== 13 && s !== 8 && s !== 9 && s !== 189 && (s !== 190 || t.$.val().match(/\./)) && i.preventDefault(); if (e.inArray(s, [37, 38, 39, 40]) > -1) { i.preventDefault(); var o = t.o.parse(t.$.val()) + l[s] * f; t.o.stopper && (o = n(r(o, t.o.max), t.o.min)); t.change(t._validate(o)); t._draw(); a = window.setTimeout(function () { f *= 2 }, 30) } } }).bind("keyup", function (e) { if (isNaN(u)) { if (a) { window.clearTimeout(a); a = null; f = 1; t.val(t.$.val()) } } else { t.$.val() > t.o.max && t.$.val(t.o.max) || t.$.val() < t.o.min && t.$.val(t.o.min) } }); this.$c.bind("mousewheel DOMMouseScroll", o); this.$.bind("mousewheel DOMMouseScroll", o) }; this.init = function () { if (this.v < this.o.min || this.v > this.o.max) { this.v = this.o.min } this.$.val(this.v); this.w2 = this.w / 2; this.cursorExt = this.o.cursor / 100; this.xy = this.w2 * this.scale; this.lineWidth = this.xy * this.o.thickness; this.lineCap = this.o.lineCap; this.radius = this.xy - this.lineWidth / 2; this.o.angleOffset && (this.o.angleOffset = isNaN(this.o.angleOffset) ? 0 : this.o.angleOffset); this.o.angleArc && (this.o.angleArc = isNaN(this.o.angleArc) ? this.PI2 : this.o.angleArc); this.angleOffset = this.o.angleOffset * Math.PI / 180; this.angleArc = this.o.angleArc * Math.PI / 180; this.startAngle = 1.5 * Math.PI + this.angleOffset; this.endAngle = 1.5 * Math.PI + this.angleOffset + this.angleArc; var e = n(String(Math.abs(this.o.max)).length, String(Math.abs(this.o.min)).length, 2) + 2; this.o.displayInput && this.i.css({ width: (this.w / 2 + 4 >> 0) + "px", height: (this.w / 3 >> 0) + "px", position: "absolute", "vertical-align": "middle", "margin-top": (this.w / 3 >> 0) + "px", "margin-left": "-" + (this.w * 3 / 4 + 2 >> 0) + "px", border: 0, background: "none", font: this.o.fontWeight + " " + (this.w / e >> 0) + "px " + this.o.font, "text-align": "center", color: this.o.inputColor || this.o.fgColor, padding: "0px", "-webkit-appearance": "none" }) || this.i.css({ width: "0px", visibility: "hidden" }) }; this.change = function (e) { this.cv = e; this.$.val(this.o.format(e)) }; this.angle = function (e) { return (e - this.o.min) * this.angleArc / (this.o.max - this.o.min) }; this.arc = function (e) { var t, n; e = this.angle(e); if (this.o.flip) { t = this.endAngle + 1e-5; n = t - e - 1e-5 } else { t = this.startAngle - 1e-5; n = t + e + 1e-5 } this.o.cursor && (t = n - this.cursorExt) && (n = n + this.cursorExt); return { s: t, e: n, d: this.o.flip && !this.o.cursor } }; this.draw = function () { var e = this.g, t = this.arc(this.cv), n, r = 1; e.lineWidth = this.lineWidth; e.lineCap = this.lineCap; if (this.o.bgColor !== "none") { e.beginPath(); e.strokeStyle = this.o.bgColor; e.arc(this.xy, this.xy, this.radius, this.endAngle - 1e-5, this.startAngle + 1e-5, true); e.stroke() } if (this.o.displayPrevious) { n = this.arc(this.v); e.beginPath(); e.strokeStyle = this.pColor; e.arc(this.xy, this.xy, this.radius, n.s, n.e, n.d); e.stroke(); r = this.cv == this.v } e.beginPath(); e.strokeStyle = r ? this.o.fgColor : this.fgColor; e.arc(this.xy, this.xy, this.radius, t.s, t.e, t.d); e.stroke() }; this.cancel = function () { this.val(this.v) } }; e.fn.dial = e.fn.knob = function (n) { return this.each(function () { var r = new t.Dial; r.o = n; r.$ = e(this); r.run() }).parent() } })


/*!Knob Directive*/
/**
 * Downward compatible, touchable dial
 * Requires: jQuery v1.7+, angularJS
 *
 * Copyright (c) 2015 Murat MERCAN
 * Under MIT License (http://www.opensource.org/licenses/mit-license.php)
 */
angular.module('directives').directive('knob', function () {
    return {
        restrict: 'ACM',
        require: 'ngModel',
        link: function (scope, elem, attrs, ngModelCtrl) {

         var  $elem = $(elem);
         $elem.knob();
         $elem.knob();
         $elem.trigger('configure', {
             'change': function (v) {
                 ngModelCtrl.$setViewValue(v);
                 scope.$apply();
             }
         });

         attrs.$observe('ngModel', function (value) {
             scope.$watch(value, function (newValue) {
                 if (newValue) {
                     $elem.val(ngModelCtrl.$viewValue).trigger('change');
                 }
             });
         });
        }
    };
});
/*
  <mm-action-modal selecteditem="activeCultures" calldetail="calldetail" detail-clicked="detailClicked"
                         callcreate="callcreate" create-clicked="createClicked"
                         calledit="calledit" save-clicked="saveClicked"
                         calldelete="calldelete" delete-clicked="deleteClicked">
            <div class="create-template">
                <form role="form">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control" ng-model="item.Name" placeholder="Name">
                    </div>
                    <div class="form-group">
                        <select ng-model="incorrectlySelected" ng-options="cat.CategoryID as cat.Name for cat in categories"></select>
                    </div>
                </form>
            </div>

            <div class="edit-template">
                <form role="form">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control" ng-model="item.Name" placeholder="Name">
                    </div>
                    <div class="form-group">
                        <select class="form-control" ng-model="item.$id" ng-options="cat.$id as cat.Name for cat in categories"></select>
                    </div>
                </form>
            </div>

            <div class="detail-template">
                <form role="form">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control" ng-model="item.Name" placeholder="Name" disabled="">
                    </div>
                </form>
            </div>
            <div class="delete-template">
                <br />
                <h4 class="text-center">Are you sure want to delete {{item.Name}} ?</h4>
            </div>
        </mm-action-modal>
*/
angular.module("directives").directive("mmActionModal", ["$compile", function ($compile) {
    return{
        restrict: "E",
        //transclude: 'element',
        transclude: true,
        template: '<div class="modal fade "  tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"><div class="modal-dialog modal-lg" style="max-height:100%" ><div class="modal-content" data-ng-class="{ \'panel-warning\':mode ==\'delete\'}"><div class="modal-header panel-heading"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
            '<h4 class="modal-title" id="myModalLabel">Mode is :{{mode}}</h4></div><div class="modal-body">' +
            '<div class="createnode" ng-show="mode==\'create\'">Create</div>' +
            '<div class="editnode" ng-show="mode==\'edit\'">Edit</div>' +
            '<div class="detailnode" ng-show="mode==\'detail\'">Detail</div>' +
            '<div class="deletenode" ng-show="mode==\'delete\'">Delete</div>'+
        '</div><div class="modal-footer" > <button type="button" class="btn btn-default" data-dismiss="modal" ng-hide="mode==\'detail\'">Cancel</button>  <button type="button" class="btn btn-primary" ng-click="modalCreateItem()" ng-show="mode==\'create\'">Create</button> <button type="button" class="btn btn-primary" ng-click="modalSaveItem()" ng-show="mode==\'edit\'">Save changes</button> <button type="button" class="btn btn-danger" ng-click="modalDeleteItem()" ng-show="mode==\'delete\'">Delete</button> </div></div>',
        link: function (scope, element, attrs, ctrl, transclude) {
            var childscope = scope.$new();
            //var childscope = scope;

            childscope.selecteditem = {};
            var createNode = element.find("div.createnode");
            var editNode = element.find("div.editnode");
            var detailNode = element.find("div.detailnode");
            var deleteNode = element.find("div.deletenode");

            transclude(childscope, function (clone) {
                angular.forEach(clone, function (elem) {
                    if (angular.element(elem).hasClass('create-template')) {
                        var createTemplate = elem.innerHTML;
                        createNode.append(createTemplate);
                    }
                    if (angular.element(elem).hasClass('edit-template')) {
                        var editTemplate = elem.innerHTML;
                        editNode.append(editTemplate);
                    }
                    if (angular.element(elem).hasClass('detail-template')) {
                        var detailTemplate = elem.innerHTML;
                        detailNode.append(detailTemplate);
                    }
                    if (angular.element(elem).hasClass('delete-template')) {
                        var deleteTemplate = elem.innerHTML;
                        deleteNode.append(deleteTemplate);
                    }
                }); 
            });

                    var saveClickedName = "";
            var detailClickedName = "";
            var createClickedName = "";
            var deleteClickedName = "";
            attrs.$observe("saveClicked", function (value) {saveClickedName = value;});
            attrs.$observe("detailClicked", function (value) {detailClickedName = value;});
            attrs.$observe("createClicked", function (value) {createClickedName = value;});
            attrs.$observe("deleteClicked", function (value) {deleteClickedName = value;});

            attrs.$observe('selecteditem', function (value) {
                scope.$watch(value, function (newValue) {
                    childscope.selecteditem = newValue;
                    childscope.item = childscope.selecteditem;
                });
            });

            attrs.$observe('calldetail', function (value) {
                scope.$watch(value, function (newValue) {
                    if (newValue == true) {
                        scope[value] = false;
                        if (childscope.selecteditem) {
                            childscope.item = childscope.selecteditem;
                            childscope.mode = "detail";
                            $('.modal', element).modal('show');
                            if (scope[detailClickedName]) { scope[detailClickedName](childscope.item); }
                        }}});});

            attrs.$observe('calledit', function (value) {
                scope.$watch(value, function(newValue) {
                    if (newValue == true) {
                        scope[value] = false;
                        if (childscope.selecteditem) {
                            childscope.originalitem = childscope.selecteditem;
                            childscope.item = angular.copy(childscope.selecteditem);
                            childscope.mode = "edit";
                            $('.modal', element).modal('show');
                        }}});});
            childscope.modalSaveItem = function() {
                angular.copy(childscope.item, childscope.originalitem);
                if (scope[saveClickedName]) {scope[saveClickedName](childscope.item);}
                $('.modal', element).modal('hide');
            };
            
            attrs.$observe('callcreate', function(value) {
                scope.$watch(value, function (newval) {
                    if (newval == true) {
                        scope[value] = false;
                        if (childscope.selecteditem) {
                            childscope.originalitem = childscope.selecteditem;
                            childscope.item = angular.copy(childscope.selecteditem);
                            childscope.mode = "create";
                            $('.modal', element).modal('show');
                        }
                    }
                });
            });
            childscope.modalCreateItem = function () {
                angular.copy(childscope.item, childscope.originalitem);
                if (scope[createClickedName]) {scope[createClickedName](childscope.item);}
                $('.modal', element).modal('hide');
            };

            attrs.$observe('calldelete', function(value) {
                scope.$watch(value, function (newval) {
                    if (newval == true) {
                        scope[value] = false;
                        if (childscope.selecteditem) {
                            childscope.item = childscope.selecteditem;
                            childscope.mode = "delete";
                            childscope.delete = true;
                            $('.modal', element).modal('show');
                        }}});
            });
            childscope.modalDeleteItem = function () {
                if (scope[deleteClickedName]) { scope[deleteClickedName](childscope.item); }
                $('.modal', element).modal('hide');
            };


            $compile(element.contents())(childscope);
        },
       // controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {}],
    };
}]);
(function () {
    angular.module('directives').directive("mmChart", ["$http", "$compile", function ($http, $compile) {
        return {
            //restrict: 'E',
            template:  "<div class='chart'></div>",
            replace: true,
            scope:{
                itemssource: '=',
                url:"@",
                type: '@',
                title: '@',
                seriesDefaults: '=',
                series: '=',
                config: "=",
                height: "=",
                width:"=",

            },
            link: function (scope, element, attrs, ngModelCtrl) {
                scope.$watch('itemssource', function (newdata, olddata) {
                    if (newdata ) {
                        var itemssource = scope.itemssource;
                        var datasource = { data: itemssource }
                        loadthechart(datasource);
                    }
                });

                var onit = true;
                $(element).mouseover(function () {
                    if (onit) {
                        var chart = $(element).data("kendoChart");
                        chart.redraw();
                    }
                    onit = false;
                })

                scope.$watch('url', function (newdata, olddata) {
                    if (newdata) {
                        var datasource = {
                            transport: {
                                read: {
                                    url: scope.url,
                                    dataType: "json"
                                }
                            }
                        };

                        loadthechart(datasource);
                    }
                });

                var chart = null;
                var loadthechart = function (datasource) {
                    //TODO:default ayarlar icin bi constant yaz
                    var title = scope.title;
                    var type = scope.type;
                    //var items = datasource;
                    var seriesDefaults = {type: type,labels: {visible: true, format: "{0}", background: "transparent" }}
                    
                    var series = scope.series;
                    if (!series) { series = [{ field: "value" }];}
                    var valueAxis = scope.valueAxis;
                    var categoryAxis = scope.categoryAxis;
                    if (!categoryAxis) { categoryAxis = { field: "text" };}

                    if (scope.config && scope.config.seriesDefaults) { seriesDefaults = scope.config.seriesDefaults; }
                    if (scope.config && scope.config.title) { title = scope.config.title; }
                    if (scope.config && scope.config.series) { series = scope.config.series; }
                    if (scope.config && scope.config.valueAxis) { valueAxis = scope.config.valueAxis; }
                    if (scope.config && scope.config.categoryAxis) { categoryAxis = scope.config.categoryAxis; }
                    if (scope.config && scope.config.legend){}
                    elem = $(element);
                    if (scope.height) {
                        elem = elem.height(scope.height);
                    }
                    if (scope.width) {
                        elem = elem.width(scope.width);
                    }
                    //  height(200)
                    //width(200)

                        chart = elem.kendoChart({
                        dataSource: datasource,
                        title: {
                            text: title,
                },
                        legend: scope.config.legend,
                        seriesColors: scope.config.seriesColors,
                        seriesDefaults: seriesDefaults,
                        series: series,
                        valueAxis: valueAxis,
                        chartArea: scope.config.chartArea,
                      
                        categoryAxis: categoryAxis,
                        tooltip: scope.config.tooltip,
                    });


                }
            },
        }
    }]);
})();
//<input type="date" class="form-control datepicker" ng-model="currentItem.OrderDate" />
(function () {
    //---Jquery IU required---//
    angular.module('directives').directive('mmDatepicker', function () {
        return {
            restrict: 'C',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelCtrl) {

                $(function () {
                    $(element).datepicker({
                        dateFormat: 'yy/mm/dd',
                        format: "dd/mm/yyyy",
                        todayBtn: "linked",
                        onSelect: function (date) {
                            ngModelCtrl.$setViewValue(date);
                            scope.$apply();
                        }
                    });
                    
                    function toDate(dateStr) {
                        var parts = dateStr.split("/");
                        return new Date(parts[2], parts[1] - 1, parts[0]);
                    }

                    attrs.$observe('ngModel', function (value) {
                        scope.$watch(value, function (newValue,oldValue) { 
                            if (newValue) {
                                if (newValue.getMonth) {
                                    if (!oldValue) {
                                        $(element).datepicker("setDate", ngModelCtrl.$viewValue);
                                    } else {
                                        olddate = new Date(oldValue);
                                        if (olddate.getMonth && (newValue.toUTCString() != olddate.toUTCString())) {
                                            $(element).datepicker("setDate", ngModelCtrl.$viewValue);
                                        }
                                    }
                                } else {
                                    var dt = toDate(ngModelCtrl.$viewValue)
                                    if (dt.getMonth) {
                                        ngModelCtrl.$setViewValue(dt);//ngmodel will be changed and  $watch will trigirred
                                    }
                                }
                                
                            }
                        });
                    });
                });
            }
        };
    });
})();
//(function () {
//    angular.module('component').directive('dropZone', function () {
//        return function (scope, element, attrs) {
//            element.dropzone({
//                //url: "/upload",
//                maxFilesize: 100,
//                paramName: "uploadfile",
//                maxThumbnailFilesize: 5
//            });
//        }
//    });
//})();


(function() {
    'use strict';
    angular.module('directives').directive('fileDropzone', function () {
        return {
            restrict: 'A',
            scope: {
                files: '=',
                fileAdded: '&',
            },
            link: function(scope, element, attrs) {
                var checkSize, isTypeValid, processDragOverOrEnter, validMimeTypes;
                processDragOverOrEnter = function(event) {
                    if (event != null) {
                        event.preventDefault();
                    }
                    event.originalEvent.dataTransfer.dropEffect = 'copy';
                    return false;
                };
                validMimeTypes = attrs.fileDropzone;
                checkSize = function(size) {
                    var _ref;
                    if (((_ref = attrs.maxFileSize) === (void 0) || _ref === '') || (size / 1024) / 1024 < attrs.maxFileSize) {
                        return true;
                    } else {
                        alert("File must be smaller than " + attrs.maxFileSize + " MB");
                        return false;
                    }
                };
                isTypeValid = function(type) {
                    if ((validMimeTypes === (void 0) || validMimeTypes === '') || validMimeTypes.indexOf(type) > -1) {
                        return true;
                    } else {
                        alert("Invalid file type.  File must be one of following types " + validMimeTypes);
                        return false;
                    }
                };
                $(element).attr('draggable', 'true');
                $(element).bind('dragover', processDragOverOrEnter);
                $(element).bind('dragenter', processDragOverOrEnter);
                return element.bind('drop', function(event) {

                    if (event != null) {
                        event.preventDefault();
                    }

                    for (var i = 0; i < event.originalEvent.dataTransfer.files.length; i++) {

                        (function(fileinput) {

                            var file, name, reader, size, type;
                            reader = new FileReader();
                            reader.onload = function(evt, reader) {
                                if (checkSize(size) && isTypeValid(type)) {
                                    return scope.$apply(function() {
                                        var currentfile = { file: evt.target.result, fileName: file.name, type: file.type, size: file.size }
                                        if (scope.fileAdded()) {
                                            var fileAddedHandler = scope.fileAdded(); fileAddedHandler(currentfile);
                                        };
                                        if (!scope.files) { scope.files = [];}
                                        if (scope.files && scope.files.push) {
                                            scope.files.push(currentfile);
                                        }
                                    });
                                }
                            };

                            file = fileinput;
                            name = file.name;
                            type = file.type;
                            size = file.size;
                            reader.readAsDataURL(file);
                        })(event.originalEvent.dataTransfer.files[i]);


                    }
                    return false;
                });
            }
        };
    });

}).call(this);


//<input class="form-control" type="file" data-fileread="currentItem.Base64Picture" name="file" id="file" />
(function () {
    angular.module('directives').directive('mmFileRead', function () {
        return {

            restrict: 'C',
            require: 'ngModel',
            link: function (scope, element, attributes, ngModelCtrl) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        ngModelCtrl.$setViewValue(loadEvent.target.result);
                        scope.$apply();
                    };
                    reader.readAsDataURL(changeEvent.target.files[0]);
                });
            }
        };
    });
})();



(function () {
    angular.module('directives').directive('mmFileUpload', function () {
        return {
            restrict: 'C',
            scope: {
                progress: '=',
                uploadfiles: '=',
                iscompleted: "=",
                completed: '&',
            },
            //require: 'ngModel',
            link: function (scope, element, attributes, ngModelCtrl) {
                element.append('<input type="button" value="Upload"/>');

                element.bind("change", function (changeEvent) {
                    scope.$apply(function (scope) {
                        console.log('files:', element.files);
                        scope.files = []
                        for (var i = 0; i < changeEvent.target.files.length; i++) {
                            scope.files.push(changeEvent.target.files[i])
                        }
                        scope.progressVisible = false
                        scope.uploadFile();
                    });
                });

                scope.uploadFile = function () {
                    var fd = new FormData()
                    for (var i in scope.files) {
                        fd.append("uploadedFile", scope.files[i])
                    }
                    var xhr = new XMLHttpRequest()
                    xhr.upload.addEventListener("progress", uploadProgress, false)
                    xhr.addEventListener("load", uploadComplete, false)
                    xhr.addEventListener("error", uploadFailed, false)
                    xhr.addEventListener("abort", uploadCanceled, false)
                    xhr.open("POST", "/Api/Upload")
                    scope.progressVisible = true
                    xhr.send(fd)
                }

                function uploadProgress(evt) {
                    scope.$apply(function () {
                        if (evt.lengthComputable) {
                            scope.progress = Math.round(evt.loaded * 100 / evt.total)
                        } else {
                            scope.progress = 'unable to compute'
                        }
                    })
                }
                function uploadComplete(evt) {
                    //alert(evt.target.responseText)
                    scope.$apply(function () {
                        scope.iscompleted = true;
                    });

                    if (scope.completed()) {
                        var completedHandler = scope.completed();
                        completedHandler(evt);
                    };

                }

                function uploadFailed(evt) {
                    alert("There was an error attempting to upload the file.")
                }

                function uploadCanceled(evt) {
                    scope.$apply(function () {
                        scope.progressVisible = false
                    })
                    alert("The upload has been canceled by the user or the browser dropped the connection.")
                }
            }
        };
    });


    angular.module('directives').directive('mmFileUploader', function () {
        return {
            template: '<div class="panel"><div class="panel-heading"><span class="panel-title">Uploads</span>' +
            '<div class="panel-heading-controls" style="width: 30%"><div ng-show="processing" class="progress progress-striped active" style="width: 100%">' +
                    '<div class="progress-bar progress-bar-danger" ng-style="percentageStyle"></div></div></div></div>' +
            '<div ng-show="errorMessage" class="alert alert-page alert-danger alert-dark"><button type="button" class="close" id="hideerroralert">×</button>' +
           '<strong>Error</strong> {{errorMessage}}' +
        '</div>' +
        '<div ng-show="iscompletedinternal" class="alert alert-page alert-success alert-dark"><button type="button" class="close" id="hidecompletealert">×</button>' +
         '<strong>Success</strong> Files are successfully uploaded.' +

        '</div>' +
        '<div class="panel-body">' +
            '<div class="row"> bbbb <input type="file"  ng-model-instant id="files" name="files" class="form-control" progress="progress" />' +
                '{{progress}}' +
                '<table class="table"><tr ><th>Name</th><th>size</th><th>Type</th></tr></thead><tbody><tr data-ng-repeat="file in files"><td>{{file.name}}</td><td>{{file.size}}</td><td>{{file.type}}</td></tr></tbody></table>' +
                '<input type="button" id="btnupload" value="Upload" class="btn btn-primary" />' +

                 '</div></div></div>',


            restrict: 'C',
            scope: {
                progress: '=',
                uploadfiles: '=',
                iscompleted: "=",
                filesuploaded: '&',
                uploadedfiles: '=',
                multiple: '@',
                uploadlocation:'@'
            },
            //require: 'ngModel',
            link: function (scope, element, attributes, ngModelCtrl) {
                scope.processing = false;
                var serverlocation = "/Api/Upload";
                if (scope.uploadlocation) {
                    serverlocation = scope.uploadlocation;
                }
                scope.hidecompletealert = function () {
                    scope.$apply(function () {
                        scope.errorMessage = null;
                    });
                }

                scope.hidecompletealert = function () {
                    scope.$apply(function () {

                    });
                }

                scope.iscompletedinternal = false;

                scope.percentageStyle = {
                    width: 0 + '%'
                };


                var files = element.find("#files");
                var uploadButton = element.find("#btnupload");
                var completeButton = element.find("#hidecompletealert");
                var errorButton = element.find("#hideerroralert");
                completeButton.bind("click", function (changeEvent) {
                    scope.$apply(function (scope) {
                        scope.iscompletedinternal = null;
                    });
                });

                errorButton.bind("click", function (changeEvent) {
                    scope.$apply(function (scope) {
                        scope.errorMessage = null;
                    });
                });
                if (scope.multiple == "true") {
                    files.attr("multiple", "multiple");
                }
                files.bind("change", function (changeEvent) {
                    scope.$apply(function (scope) {
                        console.log('files:', element.files);
                        scope.files = []
                        for (var i = 0; i < changeEvent.target.files.length; i++) {
                            scope.files.push(changeEvent.target.files[i])
                        }
                        scope.progressVisible = false

                    });
                });

                uploadButton.bind("click", function (changeEvent) {
                    scope.processing = true;
                    var fd = new FormData()
                    for (var i in scope.files) {
                        fd.append("uploadedFile", scope.files[i])
                    }
                    var xhr = new XMLHttpRequest()
                    xhr.upload.addEventListener("progress", uploadProgress, false)
                    xhr.addEventListener("load", uploadComplete, false)
                    xhr.addEventListener("error", uploadFailed, false)
                    xhr.addEventListener("abort", uploadCanceled, false)
                    xhr.open("POST", serverlocation)
                    scope.progressVisible = true
                    xhr.send(fd)
                });

                function uploadProgress(evt) {
                    scope.$apply(function () {
                        if (evt.lengthComputable) {
                            scope.percentageStyle = {
                                width: Math.round(evt.loaded * 100 / evt.total) + '%'
                            };
                            if (scope.progress) {
                                scope.progress = Math.round(evt.loaded * 100 / evt.total)
                            }
                        } else {
                            scope.progress = 'unable to compute'
                        }
                    })
                }

                function uploadComplete(evt) {
                    scope.processing = false;
                    if (evt.target.status == 404) {
                        scope.$apply(function () {
                            scope.errorMessage = "File is too big or format is not OK to upload (like exe files)";
                        });
                    } else if (evt.target.status == 500) {
                        scope.$apply(function () {
                            scope.errorMessage = "Internal Server Error ";
                        });
                    } else if (evt.target.status == 200) {
                        var response = evt.target.response;
                        var result
                        try {
                            if (JSON.parse(response)) {
                                result = JSON.parse(response);
                                if (scope.multiple != "true") {
                                    if (result[0]) {
                                        result = result[0];
                                    }
                                }
                                result = result;
                            }
                        } catch (exception) {
                            result = evt;
                        }
                        //alert(evt.target.responseText)

                        scope.$apply(function () {
                            if (scope.iscompleted) {
                                scope.iscompleted = true;
                            }
                            if (scope.uploadedfiles) {
                                scope.uploadedfiles = result;
                            }
                            scope.iscompletedinternal = true;
                        });
                        scope.$apply(function () {
                            if (scope.filesuploaded()) {
                                var filesuploadedHandler = scope.filesuploaded();
                                filesuploadedHandler(result);
                            };
                        });

                    }
                }
                function uploadFailed(evt) {
                    scope.processing = false;
                    scope.errorMessage = "There was an error attempting to upload the file.";
                }
                function uploadCanceled(evt) {
                    scope.processing = false;
                    scope.$apply(function () {
                        scope.progressVisible = false
                        scope.errorMessage = "The upload has been canceled by the user or the browser dropped the connection.";
                    })
                }
            }
        }
    });
})();


(function () {
    angular.module("directives").directive("mmFullcalendar", ["$http", "$compile", function ($http, $compile) {
        return {
            //restrict: "A",
            scope: {
                itemssource: '=',
                selectedday: '=',
                daySelected: "&",
                selectedevent: '=',
                eventSelected: "&",
                viewChanged: "&",
                fetchItems: "&",
                rerender: '=',
            },
            link: function (scope, element, attrs, ctrls) {

                scope.$watch("rerender", function (newdata, olddata) {
                    if (scope.rerender && scope.rerender == true) {
                        $(element).fullCalendar('render')
                        scope.refreshrender = false;
                    }
                });

                scope.$watch("itemssource", function (newdata, olddata) {
                    var startParam = "start";
                    var endParam = "end";
                    if (attrs.startParam) { startParam = attrs.startParam; }
                    if (attrs.endParam) { endParam = attrs.endParam; }

                    if (newdata && newdata.length && newdata.length > 0) {
                        load(scope.itemssource, startParam, endParam);
                    } else {
                        load(null, startParam, endParam);
                    }
                });
                var lastview = {};
                var loaded = false;
                var daySelectedHandler = scope.daySelected();
                var eventSelectedHandler = scope.eventSelected();
                var viewChangedHandler = scope.viewChanged();
                var fetchItemsHandler = scope.fetchItems();
                var load = function (items, startParam, endParam) {
                    if (loaded) {
                        events = function (start, end,timezone, callback) {
                            if (fetchItemsHandler) {
                                var results = fetchItemsHandler(start, end);
                                if (results) { callback(results); }
                            } else { callback(items); }
                        };

                        // $(element).fullCalendar('rerenderEvents');
                        //$('#calendar').fullCalendar('removeEventSource', events);
                        //$('#calendar').fullCalendar('addEventSource', events);
                        if (items && items.length && items.length > 0) {

                            //Error happining Here

                            try {
                                $(element).fullCalendar('refetchEvents');
                            }
                            catch (err) {
                                console.log(err);
                               // alert(err);
                             //   document.getElementById("demo").innerHTML = err.message;
                            }
                            
                        }
                        return;
                    } else {
                        loaded = true;
                        $(element).fullCalendar({
                            disableDragging: true,
                            header: {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'month,agendaWeek,agendaDay'
                            },
                            editable: true,
                            startParam: startParam,
                            endParam:endParam,
                            events: function (start, end,timezone ,callback) {
                                if (fetchItemsHandler) {
                                    var results = fetchItemsHandler(start, end);
                                    if (results) {
                                        callback(results);
                                    }
                                } else {
                                    callback(scope.itemssource);
                                }
                            },
                            eventClick: function (calEvent, jsEvent, view) {
                                
                                if (scope.selectedevent != undefined) {
                                    scope.$apply(function () { scope.selectedevent = calEvent; });
                                } else if (attrs.selectedevent) {
                                    scope.$apply(function() {
                                        scope.selectedevent = {};
                                        scope.selectedevent = calEvent;
                                    });

                                    scope.$apply(function () {
                                        scope.selectedevent = {};
                                        scope.selectedevent = calEvent;
                                    });
                                }
                                if (eventSelectedHandler) {
                                    eventSelectedHandler(calEvent);
                                };
                            },
                            dayClick: function (a) {
                                if (scope.selectedday != undefined) {
                                    scope.$apply(function () { scope.selectedday = a; });
                                } else {
                                    if (attrs.selectedday) {
                                        scope.selectedday = {};
                                        scope.$apply(function () { scope.selectedday = a; });
                                    }
                                }
                                if (daySelectedHandler) {
                                    daySelectedHandler(a);
                                };
                            },
                            viewRender: function (view, element) {
                                if ((!lastview.visStart || !lastview.visEnd) || (lastview.visStart.toString() != view.visStart.toString() || lastview.visEnd.toString() != view.visEnd.toString())) {
                                    lastview.visStart = view.visStart;
                                    lastview.visEnd = view.visEnd;
                                    if (viewChangedHandler) {
                                        viewChangedHandler(view);
                                    }
                                }
                            },
                        });
                    }
                }
            },
            //controller: function ($scope, $element, $attrs) {},
        };
    }]);
})();

angular.module('directives').value("htmlconfig", {}).directive("mmHtml", ['$compile', function ($scompile) {
    return{
        restrict: 'ACM',
      
        link: function(scope, elem, attrs, ngModelCtrl) {
            var $elem = $(elem);
            attrs.$observe('mmHtml', function (value) {
                scope.$watch(value, function (newValue) {
                    if (newValue) {
                        $elem.empty();
                        $elem.append(newValue);
                    }
                });
            });

        }
    }
    }
]);
//<div class="http-get" address="'/Api/Categoryjson'" results="categories"></div>
(function () {
    
    angular.module('directives').directive('mmHttpGet', ["$http", function ($http) {
        return {
            restrict: 'C',
            require: 'ngModel',
            //scope: {
            //    address: "@",
            //    results: "=",
            //},
            link: function (scope, element, attrs, ngModelCtrl) {
                if (!attrs.address) return;
                $http.get(attrs.address, { cache: true }).then(
                  function (results) {
                      ngModelCtrl.$setViewValue(results.data);
                  });
            }
        }
    }]);
})();

/*
 * @class Limiter
 */
angular.module('directives').directive('maxlength', [function () {
    return {
        //require: 'ngModel',
        //  replace: true,
    //transclude: true,
    //template: '<div class="input-group"><div ng-transclude></div></div>',
        link: function (scope, element, attrs, ngModelCtrl) {
           
    var wrapper = angular.element('<div class="input-group"><span class="input-group-addon"></span></div>');

        element.after(wrapper);
        wrapper.prepend(element);




var span = wrapper.find('span.input-group-addon');

        scope.$on("$destroy", function() {
          wrapper.after(element);
          wrapper.remove();
        });

            var $element = $(element);
            var isTextarea = $element.is('textarea');
            var limit = null;
            var mmCounterPropertyName = null;
            attrs.$observe('mmCounter', function(value) {
                mmCounterPropertyName = value;
                scope.$watch(value, function(newVal, oldVal) {
                })
            });

            attrs.$observe('maxlength', function (value) {
                scope.$watch(value, function (newvalue) {
                    if (newvalue) {
                        limit = newvalue;
                        limiter(newvalue);
                        if (scope && mmCounterPropertyName) {
                            scope[mmCounterPropertyName] = limit;
                        }
                         if(span && span.text) {
                            span.text( limit);
                        }
                    }
                });
            });
            var ison=true;
                attrs.$observe('ngModel', function (value) {
                scope.$watch(value, function (newvalue) {
                    if (newvalue) {



                        var chars_count, input_value;
                input_value = isTextarea ? $element[0].value.replace(/\r?\n/g, "\n") : $element.val();
                chars_count = input_value.length;
                if (chars_count > limit) {
                    $element.val(input_value.substr(0, limit));
                    chars_count = limit;
                }
                 console.log(limit - chars_count);
                if (scope && mmCounterPropertyName && scope[mmCounterPropertyName]!=null) {
                    scope[mmCounterPropertyName] = limit - chars_count;
                }
                if(span && span.text){
                    span.text( limit - chars_count);
                }


                       if(ison && (!isTextarea)){
                        $element.off("keyup focus", $.proxy(updateCounter, this));
                        ison=false;
                        }
                    }
                });
            });
            var updateCounter = function () {
                var chars_count, input_value;
                input_value = isTextarea ? $element[0].value.replace(/\r?\n/g, "\n") : $element.val();
                chars_count = input_value.length;
                if (chars_count > limit) {
                    $element.val(input_value.substr(0, limit));
                    chars_count = limit;
                }
                 console.log(limit - chars_count);
                if (scope && mmCounterPropertyName && scope[mmCounterPropertyName]!=null) {
                    scope.$apply(function() {
                        scope[mmCounterPropertyName] = limit - chars_count;
                    });
                }
                if(span && span.text){
                    span.text( limit - chars_count);
                }
            };

            var limiter = function (limit, options) {
                if (options == null) {
                    options = {};
                }
               
               
            };
            $element.on("keyup focus blur", function () {
                $.proxy(updateCounter(), this)
            });

        }
    }
}]);

angular.module("directives").directive("mmList", ["$http", "$compile","$parse", function ($http, $compile,$parse) {
    return {
        restrict: 'EA',
        transclude: true,
        template: '<div></div> <input type="text" class="navinput" style="width: 0;height:0;overflow: hidden;padding:0;border:0" />',
        link: function (scope, element, attrs, ctrl, transclude) {

            element.attr('tabindex', '0');
            var childscope = scope.$new();
            //copied from ng-repeat extact valueIdentifier and Collection Name (rhs)
            var expression = attrs.mmList;
            var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
            if (!match) { throw ('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.", expression); }
            var lhs = match[1];
            var rhs = match[2];
            var aliasAs = match[3];
            var trackByExp = match[4];
            match = lhs.match(/^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/);
            if (!match) { throw ('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.", lhs); }
            var valueIdentifier = match[3] || match[1];

            this.rhs = rhs;
            this.lhs = lhs;
            //data-template extraction
            var datatemplate = null;
            transclude(childscope, function (clone) {
                angular.forEach(clone, function (elem) {
                    if (angular.element(elem).hasClass('data-template')) {
                        datatemplate = elem.outerHTML;
                    }
                });
            });
            var parsedNgModel = $parse(attrs.selecteditem),
            parsedNgModelAssign = parsedNgModel.assign,
            ngModelGet = parsedNgModel,
            ngModelSet = parsedNgModelAssign;

            //Append ng-repeat 
            var createlist = function () {
                if (attrs.mmList) {
                    ngrepeatattr = attrs.mmList;
                }

                var datatemp = $(datatemplate);
                datatemp.attr("ng-repeat", ngrepeatattr);
                datatemp.attr("ng-click", "itemclicked(" + valueIdentifier + ")");
                datatemp.attr("data-ng-class", '{"active":mmlistselecteditem ==' + valueIdentifier + '}');
                datatemp.addClass("listitem");
                if (datatemp && datatemp[0] && datatemp[0].outerHTML) {
                    var listrepeater = datatemp[0].outerHTML;
                    element.append(listrepeater);
                    $compile(element.contents())(childscope);
                }
            };
            createlist();

            //Click Function and observes
            childscope.mmlistselecteditem = {};
            var selecteditemPropertyName = null;
            var itemselectedHandler = null;
          
            childscope.itemclicked = function (item) {

                var changedValue = childscope.mmlistselecteditem;
                childscope.mmlistselecteditem = item;
                //if (selecteditemPropertyName) { scope[selecteditemPropertyName] = item; }
                 if (ngModelSet) {
                    ngModelSet(scope, item);
                }
                if (itemselectedHandler) {
                    itemselectedHandler(item, changedValue);
                }
            };

            attrs.$observe("selecteditem", function (value, oldvalue) {
                //selecteditemPropertyName = value;
                if (ngModelSet) { ngModelSet(scope, value); }
                scope.$watch(value, function (newvalue,oldValue) {
                    if (newvalue) {
                        if (newvalue !== childscope.mmlistselecteditem) {
                            childscope.mmlistselecteditem = newvalue;
                        }
                    }// else if (selecteditemPropertyName) { scope[selecteditemPropertyName] = {}; }
                    else if (ngModelSet) { ngModelSet(scope, {}); }
                });
            });

            attrs.$observe("itemselected", function (value) {
                if (value && scope[value] && angular.isFunction(scope[value])) { itemselectedHandler = scope[value]; }
            });

            element.bind("keydown keypress", function (event) {
                if (event.which === 13) { // enter
                    if ($(".services").is(":visible")) {
                        selectOption();
                    } else {
                        $(".services").show();
                    }
                    menuOpen = !menuOpen;
                }
                if (event.which === 38) { // up
                    var selected = $(".active", element);
                    if (selected.prev().length == 0) {
                        selected.siblings().last().addClass("selected");
                        
                    } else {
                        var scopee = $(".active", element).prev().scope()[lhs];
                        if (scopee) {
                            scope.$apply(function () {
                                childscope.itemclicked(scopee);
                            });
                        }
                    }
                    event.preventDefault();
                }
                if (event.which === 40) { // down
                    var selected = $(".active",element);
                    if (selected.next().length == 0) {
                        var scopee = $(".active", element).first().scope()[lhs];
                        if (scopee) {
                            scope.$apply(function () {
                                childscope.itemclicked(scopee);
                            });
                        }
                    } else {
                        var scopee = $(".active", element).next().scope()[lhs];
                        if(scopee)
                        {

                            $(element).animate({
                                scrollTop: $(".active", element).next().offset().top
                            }, 0);


                            scope.$apply(function () {
                                childscope.itemclicked(scopee);
                            });
                        }
                    }
                    event.preventDefault();
                }
            });



            //$(element).click(function () {
            //    $('.navinput', element).focus();
            //});

            //$(element).keydown(function (e) {
            //    switch (e.which) {
            //        case 37: // left
            //            break;
            //            alert("left");
            //        case 38: // up
            //            alert("Up");
            //            break;

            //        case 39: // right
            //            break;

            //        case 40: // down

            //            //$(element).next().css("background-color", "red");

            //            $(".active", element).next().css("background-color", "red");


            //            var scopee = $(".active", element).next().scope().node;
            //            var Name = scope.Name;
            //            break;

            //        default: return; // exit this handler for other keys
            //    }
            //    e.preventDefault(); // prevent the default action (scroll / move caret)
            //},this);

        },

        controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {

        }]
    }
}]);




















angular.module("directives").directive("mmmTable", ["$http", "$compile", function ($http, $compile) {
    return {
        restrict: 'A',
        transclude: true,
        template: "<table class='table'><thead><tr class='headerholder'></tr></thead><tbody class='rowholder'></tbody></table> <div class='modalcontainer'></div>",
        // replace:true,
        link: function (scope, element, attrs, ctrl, transclude) {

            var rowholderNode = element.find("tbody.rowholder");
            var headerholderNode = element.find("tr.headerholder");
            var modalcontainer = element.find("div.modalcontainer");
            var templatetable = element.find("table.table");

            var childscope = scope.$new();
            var itemsourcePropertyName = "";

            //copied from ng-repeat extact valueIdentifier and Collection Name (rhs)
            var expression = attrs.mmmTable;
            var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
            if (!match) throw ('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.", expression);
            var lhs = match[1];
            var rhs = match[2];
            var aliasAs = match[3];
            var trackByExp = match[4];
            match = lhs.match(/^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/);
            if (!match) throw ('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.", lhs);

            var valueIdentifier = match[3] || match[1];

            var orderedField = "mmtableSort";
            var isorderBy = false;
            var parts = rhs.split("|");
            itemsourcePropertyName = parts[0].trim();
            for (i = 0; i < parts.length; i++) {
                var filter = parts[i].split(':');
                if (filter && filter.length && filter.length > 1) {
                    var filtername = filter[0].trim();
                    if (filtername == "orderBy") {
                        isorderBy = true;
                        orderedField = filter[1].trim();
                    }
                }
            }
            if (!isorderBy) attrs.mmmTable = attrs.mmmTable + " | orderBy:mmtableSort:descending";
            //data-template extraction
            var datatemplate = "";
            var editTemplate = null;
            var detailTemplate = null;
            var deleteTemplate = null;
            var headertemplate = null;
            transclude(childscope, function (clone) {
                angular.forEach(clone, function (elem) {
                    if (angular.element(elem).hasClass('edit-template')) editTemplate = "<div class='edit-template'>" + elem.innerHTML + "</div>"
                    if (angular.element(elem).hasClass('detail-template')) detailTemplate = "<div class='detail-template'>" + elem.innerHTML + "</div>"
                    if (angular.element(elem).hasClass('delete-template')) deleteTemplate = "<div class='delete-template'>" + elem.innerHTML + "</div>"

                    if (angular.element(elem).hasClass('data-template')) {
                        var temp = $("td", elem).each(function (_, slide) {
                            datatemplate += slide.outerHTML;
                        });
                        datatemplate = "<tr>" + datatemplate + "</tr>";
                    }
                    var h = angular.element(clone, "thead")
                    var temp = $("th", h).each(function (_, slide) {
                        headertemplate += "<th>" + slide.innerHTML + "</th>";
                    });
                });
            });

            //Append ng-repeat 
            var idfieldPropertyName = null;
            function createheader(columns, orderField) {
                var tablehead = "";
                for (var i = 0; i < columns.length; i++) {
                    title = columns[i].replace("_", " ").split(/(?=[A-Z])/).join(" ");
                    tablehead += "<th><a class='pointer' ng-click='mmtableSortit(\"" + columns[i] + "\")' > " + title + " <span ng-show='mmtableSort == \"" + columns[i] + "\"' > <span ng-show='descending'> <i class='fa fa-caret-square-o-down'></i>  </span>  <span ng-hide='descending'> <i class='fa fa-caret-square-o-up'></i> </span>  </span>  </a> </th>"
                }
                if (editTemplate || detailTemplate || deleteTemplate) tablehead += "<th>Actions</th>"
                headerholderNode.html(tablehead);
            };

            function createtable(columns, linkpath) {
                if (!linkpath) { linkpath = window.location.hash }
                if (attrs.mmmTable) { ngrepeatattr = attrs.mmmTable; }

                if (datatemplate == "") {
                    rowtext = "";
                    for (var i = 0; i < columns.length; i++) {
                        if (i == 0 && idfieldPropertyName) {
                            rowtext += '<td><a ng-href=' + linkpath + '/{{' + valueIdentifier + '.' + idfieldPropertyName + '}}> <span data-ng-bind="' + valueIdentifier + '.' + columns[i] + '"></span></a> </td>';
                        } else {
                            rowtext += '<td><span data-ng-bind="' + valueIdentifier + '.' + columns[i] + '"></span></td>';
                        }
                    }
                    var datatemp = $("<tr>" + rowtext + "</tr>");
                } else {
                    var datatemp = $(datatemplate);
                }

                if (editTemplate || detailTemplate || deleteTemplate) {
                    var btngtroups = ""
                    btngtroups += "<td><div class='btn-group'><button type='button' class='btn btn-primary dropdown-toggle' data-toggle='dropdown'>Actions <span class='caret'></span></button><ul class='dropdown-menu' role='menu'>";
                    if (detailTemplate) btngtroups += "<li><a ng-click='mmtablebtnDetailItem(" + valueIdentifier + ")'>Detail</a></li>";
                    if (editTemplate) btngtroups += "<li><a ng-click='mmtablebtnSaveItem(" + valueIdentifier + ")'>Edit</a></li>";
                    if (deleteTemplate) btngtroups += "<li class='divider'></li> <li><a ng-click='mmtablebtnDeleteItem(" + valueIdentifier + ")'>Delete</a></li></ul></div></td>";

                    datatemp.append(btngtroups);
                    prepeareActions();
                }

                datatemp.attr("data-ng-repeat", ngrepeatattr);
                datatemp.attr("ng-click", "itemclicked(" + valueIdentifier + ")");
                datatemp.attr("data-ng-class", '{"active":mmlistselecteditem ==' + valueIdentifier + '}');
                // datatemp.addClass("listitem");
                if (datatemp && datatemp[0] && datatemp[0].outerHTML) {
                    var listrepeater = datatemp[0].outerHTML;
                    rowholderNode.html(listrepeater);
                    $compile(element.contents())(childscope);
                }
            };

            //Click Function and observes
            childscope.mmlistselecteditem = {};
            var selecteditemPropertyName = null;
            var itemselectedHandler = null;
            childscope.itemclicked = function (item) {
                childscope.mmlistselecteditem = item;
                if (selecteditemPropertyName) scope[selecteditemPropertyName] = item;
                if (itemselectedHandler) itemselectedHandler(item);
            };

            attrs.$observe("selecteditem", function (value, oldvalue) {
                selecteditemPropertyName = value;
                scope.$watch(value, function (newvalue) {
                    if (newvalue) {
                        if (newvalue !== childscope.mmlistselecteditem) childscope.mmlistselecteditem = newvalue;;
                    } else if (selecteditemPropertyName) {
                        scope[selecteditemPropertyName] = {};
                    }
                });
            });

            attrs.$observe("itemselected", function (value) {
                if (value && scope[value] && angular.isFunction(scope[value])) itemselectedHandler = scope[value];
            });

            attrs.$observe('idfield', function (value) {
                idfieldPropertyName = value;
            });

            //observe column or itemsource
            if (attrs.columns) {
                var firstime = true;
                attrs.$observe('columns', function (value) {
                    scope.$watch(value, function (newValue, oldVal) {
                        if (newValue && (newValue.toString() != oldVal.toString() || firstime)) {
                            firstime = false;
                            createheader(newValue, orderedField);
                            createtable(newValue);
                        }
                    });
                });
            }
            else {
                scope.$watch(itemssourcePropertyName, function (newVal, oldVal) {
                    if (newVal && !columns) {
                        if (newVal && newVal[0]) {
                            var columns = [];
                            for (prop in newVal[0]) { columns.push(prop); }
                            createheader(columns, orderedField);
                            createtable(columns);
                        }
                    }
                });
            };

            //Sorting and selection Functions
            childscope.mmtableSort = "";
            childscope.descending = false;
            childscope.mmtablecursor = "auto";

            childscope.mmtableSortit = function (item) {
                if (childscope.mmtableSort == item) {
                    childscope.descending = !childscope.descending;
                } else {
                    childscope.descending = false;
                    if (orderedField) {
                        scope[orderedField] = item;
                        childscope.mmtableSort = item;
                    }
                }
            };
            childscope.mmtableSelected = function (item) {
                childscope.mmtablecursor = "hand";
                if (childscope.mmtableIntSelectedItem != item) {
                    childscope.mmtableIntSelectedItem = item;
                }
                if (itemselectedHandler) itemselectedHandler(item);
                if (selecteditemPropertyName) scope[selecteditemPropertyName] = item;
            };

            function prepeareActions() {

                var detailClickedHandler = null;
                var saveClickedHandler = null;
                var deleteClickedHandler = null;

                attrs.$observe('detailClicked', function (value) {
                    if (value && scope[value] && angular.isFunction(scope[value])) { detailClickedHandler = scope[value]; }
                });
                attrs.$observe('saveClicked', function (value) {
                    if (value && scope[value] && angular.isFunction(scope[value])) { saveClickedHandler = scope[value]; }
                });
                attrs.$observe('deleteClicked', function (value) {
                    if (value && scope[value] && angular.isFunction(scope[value])) { deleteClickedHandler = scope[value]; }
                });
                if (editTemplate || detailTemplate || deleteTemplate) {
                    var actionModal = "<mm-action-modal selecteditem='mmtableselecteditem' calldetail='mmtablecalldetail' detail-clicked='mmtabledetailClicked'" +
                        "calledit='mmtablecalledit' save-clicked='mmtableSaveClicked' " + "calldelete='mmtablecalldelete' delete-clicked='mmtabledeleteClicked'>" +
                        editTemplate + detailTemplate + deleteTemplate + "</mm-action-modal>";
                    modalcontainer.html(actionModal);
                    $compile(modalcontainer)(childscope);
                }

                childscope.mmtablebtnDetailItem = function (item) {
                    childscope.mmtableselecteditem = item;
                    childscope.mmtablecalldetail = true;
                    if (detailClickedHandler) { detailClickedHandler(childscope.mmtableselecteditem); }
                };
                childscope.mmtablebtnSaveItem = function (item) {
                    childscope.originalitem = item;
                    childscope.mmtableselecteditem = angular.copy(item);
                    childscope.mmtablecalledit = true;
                };
                childscope.mmtableSaveClicked = function (item) { angular.copy(item, childscope.originalitem); if (saveClickedHandler) { saveClickedHandler(childscope.originalitem); } };

                childscope.mmtablebtnDeleteItem = function (item) { childscope.mmtableselecteditem = item; childscope.mmtablecalldelete = true; };
                childscope.mmtabledeleteClicked = function (item) { if (deleteClickedHandler) { deleteClickedHandler(item); } };
            }

        },

        controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
        }]
    }
}]);
//moved in to storage Service file
//<mm-treeview itemssource="assemb" selected-id="selectidid" nullvalue="'749'" selectedtext="selectedText" idfield="ComponentID" textfield="ComponentName" parentfield="ProductAssemblyID"></mm-treeview>
(function () {
    //---Jquery IU required---//
    angular.module('directives').directive('mmMap', function () {
        return {
            restrict: 'A',
            scope: {
                itemssource: '=',
                latitudefield: '@',
                longitudefield: '@',
                center: '=',
                isgeojson: '@',
                itemselected: "&",
                selecteditem: '=',
                rerender:'=',
            },
            link: function (scope, element, attrs) {

                //var mapOptions = {
                //    center: new google.maps.LatLng(-34.397, 150.644),
                //    zoom: 8
                //};
                //var map = new google.maps.Map(element[0],
                //    mapOptions);


                if (!window.google) {
                    return;
                }
                var geocoder = new window.google.maps.Geocoder();
                var myOptions = { zoom: 2, center: new window.google.maps.LatLng(12.24, 24.54), mapTypeId: 'terrain' };
                var map = new window.google.maps.Map($(element)[0], myOptions);

                try {
                    map.clearOverlays();
                } catch (err) {
                }
                var draggable = true;
                if (attrs.draggable == "false") {
                    draggable = false
                }

                scope.$watch("rerender", function (newvalue) {
                    if (newvalue && newvalue == true) {
                        window.google.maps.event.trigger(map, 'resize');
                        map.setZoom(map.getZoom());
                        scope.rerender = false;
                    }
                });

                var AddValueToLocation = function (value, map, scope) {
                    var Latitude = null; scope.latitudefield ? Latitude = value[scope.latitudefield] : value.Latitude;
                    var Longitude = null; scope.longitudefield ? Longitude = value[scope.longitudefield] : value.LatitudeLongitude;
                    var position = new window.google.maps.LatLng(Latitude, Longitude);

                    var marker = new window.google.maps.Marker({
                        map: map,
                        draggable: draggable,
                        position: position,
                        title: name
                    });
                    //value.Longitude.subscribe(function (val) {
                    //    var lat = value.Latitude();
                    //    var lng = value.Longitude();
                    //    var newLatLng = new google.maps.LatLng(lat, lng);
                    //    marker.setPosition(newLatLng);
                    //});

                    value._mapMarker = marker;
                    if (!scope.markersArray) { scope.markersArray = []; }
                    scope.markersArray[value.ID] = value;

                    window.google.maps.event.addListener(marker, 'position_changed',
                        function () {
                            scope.latitudefield ? value[scope.latitudefield] = marker.position.lat() : value.Latitude = marker.position.lat();
                            scope.longitudefield ? value[scope.longitudefield] = marker.position.lng() : value.LatitudeLongitude = marker.position.lng();

                        });

                    if (scope.itemselected || scope.selecteditem) {
                        window.google.maps.event.addListener(marker, 'click',
                           function () {
                               if (scope.selecteditem) {
                                   scope.selecteditem = value;
                               }

                               scope.$apply(function () {
                                   scope.selecteditem = value;
                               });

                               if (scope.itemselected) {
                                   var itemselectedHandler = scope.itemselected();
                                   if (itemselectedHandler) {
                                       itemselectedHandler(value);
                                   }
                               }

                           });
                    }
                };



                scope.$watch("itemssource", function (newValue) {
                    if (scope.itemssource) {

                        try {
                            map.clearOverlays();
                        } catch (err) {
                        }


                        $.each(scope.itemssource, function (index, value) {
                            AddValueToLocation(value, map, scope);
                        });
                    }

                });





                //var mapdetail = new google.maps.Map($('#mapDetail_canvas')[0], myOptions);
                //allBindingsAccessor().GoogleMap.clearOverlays();
                //AddValueToLocation(allBindingsAccessor().map, allBindingsAccessor().GoogleMap);
                // var position = new google.maps.LatLng(allBindingsAccessor().latitude(), allBindingsAccessor().longitude());
                // var marker = new google.maps.Marker({
                //     map: allBindingsAccessor().map,
                //     draggable: true,
                //     position: position,
                //     title: name
                // });

                // value._mapMarker = marker;
                //// markersArray.push(value);
                // markersArray[value.ID()] = value;
                // google.maps.event.addListener(marker, 'position_changed',
                //     function () {
                //         viewModel.Latitude(marker.position.lat());
                //         viewModel.Longitude(marker.position.lng());
                //     });



            },
            controller: function ($scope, $element, $attrs) {

            },
        }
    });


    angular.module('directives').directive('mmMapCollection', function () {
        return {
            restrict: 'E',
            scope: {
            },
            link: function (scope, element, attrs) {



            },
            controller: function ($scope, $element, $attrs) {

            },
        }
    });

    if (window.google && window.google.maps) {
        window.google.maps.Map.prototype.clearOverlays = function () {
            if (markersArray) {
                //for (var i = 0; i < markersArray.length; i++) {
                //    markersArray[i]._mapMarker.setMap(null);
                //    markersArray[i]._mapMarker=null;

                //}
                for (var item in markersArray) {
                    markersArray[item]._mapMarker.setMap(null);
                    markersArray[item]._mapMarker = null;
                }
            }
            markersArray = [];
        }
    }


    //var GeoJSON = function (geojson, options) {

    //    var _geometryToGoogleMaps = function (geojsonGeometry, options, geojsonProperties) {

    //        var googleObj, opts = _copy(options);

    //        switch (geojsonGeometry.type) {
    //            case "Point":
    //                opts.position = new google.maps.LatLng(geojsonGeometry.coordinates[1], geojsonGeometry.coordinates[0]);
    //                googleObj = new google.maps.Marker(opts);
    //                if (geojsonProperties) {
    //                    googleObj.set("geojsonProperties", geojsonProperties);
    //                }
    //                break;

    //            case "MultiPoint":
    //                googleObj = [];
    //                for (var i = 0; i < geojsonGeometry.coordinates.length; i++) {
    //                    opts.position = new google.maps.LatLng(geojsonGeometry.coordinates[i][1], geojsonGeometry.coordinates[i][0]);
    //                    googleObj.push(new google.maps.Marker(opts));
    //                }
    //                if (geojsonProperties) {
    //                    for (var k = 0; k < googleObj.length; k++) {
    //                        googleObj[k].set("geojsonProperties", geojsonProperties);
    //                    }
    //                }
    //                break;

    //            case "LineString":
    //                var path = [];
    //                for (var i = 0; i < geojsonGeometry.coordinates.length; i++) {
    //                    var coord = geojsonGeometry.coordinates[i];
    //                    var ll = new google.maps.LatLng(coord[1], coord[0]);
    //                    path.push(ll);
    //                }
    //                opts.path = path;
    //                googleObj = new google.maps.Polyline(opts);
    //                if (geojsonProperties) {
    //                    googleObj.set("geojsonProperties", geojsonProperties);
    //                }
    //                break;

    //            case "MultiLineString":
    //                googleObj = [];
    //                for (var i = 0; i < geojsonGeometry.coordinates.length; i++) {
    //                    var path = [];
    //                    for (var j = 0; j < geojsonGeometry.coordinates[i].length; j++) {
    //                        var coord = geojsonGeometry.coordinates[i][j];
    //                        var ll = new google.maps.LatLng(coord[1], coord[0]);
    //                        path.push(ll);
    //                    }
    //                    opts.path = path;
    //                    googleObj.push(new google.maps.Polyline(opts));
    //                }
    //                if (geojsonProperties) {
    //                    for (var k = 0; k < googleObj.length; k++) {
    //                        googleObj[k].set("geojsonProperties", geojsonProperties);
    //                    }
    //                }
    //                break;

    //            case "Polygon":
    //                var paths = [];
    //                var exteriorDirection;
    //                var interiorDirection;
    //                for (var i = 0; i < geojsonGeometry.coordinates.length; i++) {
    //                    var path = [];
    //                    for (var j = 0; j < geojsonGeometry.coordinates[i].length; j++) {
    //                        var ll = new google.maps.LatLng(geojsonGeometry.coordinates[i][j][1], geojsonGeometry.coordinates[i][j][0]);
    //                        path.push(ll);
    //                    }
    //                    if (!i) {
    //                        exteriorDirection = _ccw(path);
    //                        paths.push(path);
    //                    } else if (i == 1) {
    //                        interiorDirection = _ccw(path);
    //                        if (exteriorDirection == interiorDirection) {
    //                            paths.push(path.reverse());
    //                        } else {
    //                            paths.push(path);
    //                        }
    //                    } else {
    //                        if (exteriorDirection == interiorDirection) {
    //                            paths.push(path.reverse());
    //                        } else {
    //                            paths.push(path);
    //                        }
    //                    }
    //                }
    //                opts.paths = paths;
    //                googleObj = new google.maps.Polygon(opts);
    //                if (geojsonProperties) {
    //                    googleObj.set("geojsonProperties", geojsonProperties);
    //                }
    //                break;

    //            case "MultiPolygon":
    //                googleObj = [];
    //                for (var i = 0; i < geojsonGeometry.coordinates.length; i++) {
    //                    var paths = [];
    //                    var exteriorDirection;
    //                    var interiorDirection;
    //                    for (var j = 0; j < geojsonGeometry.coordinates[i].length; j++) {
    //                        var path = [];
    //                        for (var k = 0; k < geojsonGeometry.coordinates[i][j].length; k++) {
    //                            var ll = new google.maps.LatLng(geojsonGeometry.coordinates[i][j][k][1], geojsonGeometry.coordinates[i][j][k][0]);
    //                            path.push(ll);
    //                        }
    //                        if (!j) {
    //                            exteriorDirection = _ccw(path);
    //                            paths.push(path);
    //                        } else if (j == 1) {
    //                            interiorDirection = _ccw(path);
    //                            if (exteriorDirection == interiorDirection) {
    //                                paths.push(path.reverse());
    //                            } else {
    //                                paths.push(path);
    //                            }
    //                        } else {
    //                            if (exteriorDirection == interiorDirection) {
    //                                paths.push(path.reverse());
    //                            } else {
    //                                paths.push(path);
    //                            }
    //                        }
    //                    }
    //                    opts.paths = paths;
    //                    googleObj.push(new google.maps.Polygon(opts));
    //                }
    //                if (geojsonProperties) {
    //                    for (var k = 0; k < googleObj.length; k++) {
    //                        googleObj[k].set("geojsonProperties", geojsonProperties);
    //                    }
    //                }
    //                break;

    //            case "GeometryCollection":
    //                googleObj = [];
    //                if (!geojsonGeometry.geometries) {
    //                    googleObj = _error("Invalid GeoJSON object: GeometryCollection object missing \"geometries\" member.");
    //                } else {
    //                    for (var i = 0; i < geojsonGeometry.geometries.length; i++) {
    //                        googleObj.push(_geometryToGoogleMaps(geojsonGeometry.geometries[i], opts, geojsonProperties || null));
    //                    }
    //                }
    //                break;

    //            default:
    //                googleObj = _error("Invalid GeoJSON object: Geometry object must be one of \"Point\", \"LineString\", \"Polygon\" or \"MultiPolygon\".");
    //        }

    //        return googleObj;

    //    };

    //    var _error = function (message) {

    //        return {
    //            type: "Error",
    //            message: message
    //        };

    //    };

    //    var _ccw = function (path) {
    //        var isCCW;
    //        var a = 0;
    //        for (var i = 0; i < path.length - 2; i++) {
    //            a += ((path[i + 1].lat() - path[i].lat()) * (path[i + 2].lng() - path[i].lng()) - (path[i + 2].lat() - path[i].lat()) * (path[i + 1].lng() - path[i].lng()));
    //        }
    //        if (a > 0) {
    //            isCCW = true;
    //        }
    //        else {
    //            isCCW = false;
    //        }
    //        return isCCW;
    //    };

    //    var _copy = function (obj) {
    //        var newObj = {};
    //        for (var i in obj) {
    //            if (obj.hasOwnProperty(i)) {
    //                newObj[i] = obj[i];
    //            }
    //        }
    //        return newObj;
    //    };

    //    var obj;

    //    var opts = options || {};

    //    switch (geojson.type) {

    //        case "FeatureCollection":
    //            if (!geojson.features) {
    //                obj = _error("Invalid GeoJSON object: FeatureCollection object missing \"features\" member.");
    //            } else {
    //                obj = [];
    //                for (var i = 0; i < geojson.features.length; i++) {
    //                    obj.push(_geometryToGoogleMaps(geojson.features[i].geometry, opts, geojson.features[i].properties));
    //                }
    //            }
    //            break;

    //        case "GeometryCollection":
    //            if (!geojson.geometries) {
    //                obj = _error("Invalid GeoJSON object: GeometryCollection object missing \"geometries\" member.");
    //            } else {
    //                obj = [];
    //                for (var i = 0; i < geojson.geometries.length; i++) {
    //                    obj.push(_geometryToGoogleMaps(geojson.geometries[i], opts));
    //                }
    //            }
    //            break;

    //        case "Feature":
    //            if (!(geojson.properties && geojson.geometry)) {
    //                obj = _error("Invalid GeoJSON object: Feature object missing \"properties\" or \"geometry\" member.");
    //            } else {
    //                obj = _geometryToGoogleMaps(geojson.geometry, opts, geojson.properties);
    //            }
    //            break;

    //        case "Point": case "MultiPoint": case "LineString": case "MultiLineString": case "Polygon": case "MultiPolygon":
    //            obj = geojson.coordinates
    //                ? obj = _geometryToGoogleMaps(geojson, opts)
    //                : _error("Invalid GeoJSON object: Geometry object missing \"coordinates\" member.");
    //            break;

    //        default:
    //            obj = _error("Invalid GeoJSON object: GeoJSON object must be one of \"Point\", \"LineString\", \"Polygon\", \"MultiPolygon\", \"Feature\", \"FeatureCollection\" or \"GeometryCollection\".");

    //    }

    //    return obj;

    //};

})();
/*
    jQuery Masked Input Plugin
    Copyright (c) 2007 - 2015 Josh Bush (digitalbush.com)
    Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
    Version: 1.4.1
*/
!function (a) { "function" == typeof define && define.amd ? define(["jquery"], a) : a("object" == typeof exports ? require("jquery") : jQuery) }(function (a) { var b, c = navigator.userAgent, d = /iphone/i.test(c), e = /chrome/i.test(c), f = /android/i.test(c); a.mask = { definitions: { 9: "[0-9]", a: "[A-Za-z]", "*": "[A-Za-z0-9]" }, autoclear: !0, dataName: "rawMaskFn", placeholder: "_" }, a.fn.extend({ caret: function (a, b) { var c; if (0 !== this.length && !this.is(":hidden")) return "number" == typeof a ? (b = "number" == typeof b ? b : a, this.each(function () { this.setSelectionRange ? this.setSelectionRange(a, b) : this.createTextRange && (c = this.createTextRange(), c.collapse(!0), c.moveEnd("character", b), c.moveStart("character", a), c.select()) })) : (this[0].setSelectionRange ? (a = this[0].selectionStart, b = this[0].selectionEnd) : document.selection && document.selection.createRange && (c = document.selection.createRange(), a = 0 - c.duplicate().moveStart("character", -1e5), b = a + c.text.length), { begin: a, end: b }) }, unmask: function () { return this.trigger("unmask") }, mask: function (c, g) { var h, i, j, k, l, m, n, o; if (!c && this.length > 0) { h = a(this[0]); var p = h.data(a.mask.dataName); return p ? p() : void 0 } return g = a.extend({ autoclear: a.mask.autoclear, placeholder: a.mask.placeholder, completed: null }, g), i = a.mask.definitions, j = [], k = n = c.length, l = null, a.each(c.split(""), function (a, b) { "?" == b ? (n--, k = a) : i[b] ? (j.push(new RegExp(i[b])), null === l && (l = j.length - 1), k > a && (m = j.length - 1)) : j.push(null) }), this.trigger("unmask").each(function () { function h() { if (g.completed) { for (var a = l; m >= a; a++) if (j[a] && C[a] === p(a)) return; g.completed.call(B) } } function p(a) { return g.placeholder.charAt(a < g.placeholder.length ? a : 0) } function q(a) { for (; ++a < n && !j[a];); return a } function r(a) { for (; --a >= 0 && !j[a];); return a } function s(a, b) { var c, d; if (!(0 > a)) { for (c = a, d = q(b) ; n > c; c++) if (j[c]) { if (!(n > d && j[c].test(C[d]))) break; C[c] = C[d], C[d] = p(d), d = q(d) } z(), B.caret(Math.max(l, a)) } } function t(a) { var b, c, d, e; for (b = a, c = p(a) ; n > b; b++) if (j[b]) { if (d = q(b), e = C[b], C[b] = c, !(n > d && j[d].test(e))) break; c = e } } function u() { var a = B.val(), b = B.caret(); if (o && o.length && o.length > a.length) { for (A(!0) ; b.begin > 0 && !j[b.begin - 1];) b.begin--; if (0 === b.begin) for (; b.begin < l && !j[b.begin];) b.begin++; B.caret(b.begin, b.begin) } else { for (A(!0) ; b.begin < n && !j[b.begin];) b.begin++; B.caret(b.begin, b.begin) } h() } function v() { A(), B.val() != E && B.change() } function w(a) { if (!B.prop("readonly")) { var b, c, e, f = a.which || a.keyCode; o = B.val(), 8 === f || 46 === f || d && 127 === f ? (b = B.caret(), c = b.begin, e = b.end, e - c === 0 && (c = 46 !== f ? r(c) : e = q(c - 1), e = 46 === f ? q(e) : e), y(c, e), s(c, e - 1), a.preventDefault()) : 13 === f ? v.call(this, a) : 27 === f && (B.val(E), B.caret(0, A()), a.preventDefault()) } } function x(b) { if (!B.prop("readonly")) { var c, d, e, g = b.which || b.keyCode, i = B.caret(); if (!(b.ctrlKey || b.altKey || b.metaKey || 32 > g) && g && 13 !== g) { if (i.end - i.begin !== 0 && (y(i.begin, i.end), s(i.begin, i.end - 1)), c = q(i.begin - 1), n > c && (d = String.fromCharCode(g), j[c].test(d))) { if (t(c), C[c] = d, z(), e = q(c), f) { var k = function () { a.proxy(a.fn.caret, B, e)() }; setTimeout(k, 0) } else B.caret(e); i.begin <= m && h() } b.preventDefault() } } } function y(a, b) { var c; for (c = a; b > c && n > c; c++) j[c] && (C[c] = p(c)) } function z() { B.val(C.join("")) } function A(a) { var b, c, d, e = B.val(), f = -1; for (b = 0, d = 0; n > b; b++) if (j[b]) { for (C[b] = p(b) ; d++ < e.length;) if (c = e.charAt(d - 1), j[b].test(c)) { C[b] = c, f = b; break } if (d > e.length) { y(b + 1, n); break } } else C[b] === e.charAt(d) && d++, k > b && (f = b); return a ? z() : k > f + 1 ? g.autoclear || C.join("") === D ? (B.val() && B.val(""), y(0, n)) : z() : (z(), B.val(B.val().substring(0, f + 1))), k ? b : l } var B = a(this), C = a.map(c.split(""), function (a, b) { return "?" != a ? i[a] ? p(b) : a : void 0 }), D = C.join(""), E = B.val(); B.data(a.mask.dataName, function () { return a.map(C, function (a, b) { return j[b] && a != p(b) ? a : null }).join("") }), B.one("unmask", function () { B.off(".mask").removeData(a.mask.dataName) }).on("focus.mask", function () { if (!B.prop("readonly")) { clearTimeout(b); var a; E = B.val(), a = A(), b = setTimeout(function () { B.get(0) === document.activeElement && (z(), a == c.replace("?", "").length ? B.caret(0, a) : B.caret(a)) }, 10) } }).on("blur.mask", v).on("keydown.mask", w).on("keypress.mask", x).on("input.mask paste.mask", function () { B.prop("readonly") || setTimeout(function () { var a = A(!0); B.caret(a), h() }, 0) }), e && f && B.off("input.mask").on("input.mask", u), A() }) } }) });





angular.module('directives')
    .constant('mmMaskConfig', {}).directive("mmMask", [
        "$http", "$compile", "mmMaskConfig", function($http, $compile, mmMaskConfig) {
            return {
                restrict: 'ACM',
                require: 'ngModel',
                transclude: true,
                link: function (scope, element, attrs, ctrl, transclude) {
                    // $("#masked-inputs-examples-date").mask("99/99/9999");
                    var mask = attrs.mmMask;

                   // var res = scope.$eval(attrs.mmMask);
                   // alert(res);

                    $(element).mask(mask);
                }
            }
        }
    ]);
angular.module("directives")
    .value('mmRatingConfig', {
    stars_count: 5,
    rating: 0,
    class_active: 'active',
    lower_limit: 0.35,
    onRatingChange: function (value) { }
    })
    .directive('mmRating', ['mmRatingConfig', '$timeout', "$compile", function (mmRatingConfig, $timeout, $compile) {
    return {
            restrict: 'ACM',
            require: 'ngModel',
            template:'<ul class="widget-rating"></ul>',
            link: function(scope, elem, attrs, ngModelCtrl) {
                var $elem = $(elem);
                var isDisabled = false;
                var container = elem.find("ul.widget-rating");
                var  _i, _ref;
                if (options == null) {
                   var options = {};
                }
                var options = angular.extend({}, mmRatingConfig, options);
                for (i = _i = 0, _ref = options.stars_count; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                    container.append($compile('<li><a class="pointer" title="" class="widget-rating-item"></a></li>')(scope));
                }
                var setRating = function(value) {
                    options.rating = value;
                    if ((value - Math.floor(value)) > options.lower_limit) { value = Math.ceil(value); }else {value = Math.floor(value);}
                    ngModelCtrl.$setViewValue(value);
                    return container.find('li').removeClass(options.class_active).slice(0, value).addClass(options.class_active);
                };
               
                    $elem.find('a')
                        .on('mouseenter', function() {
                            if (!isDisabled) {
                                $elem.find('li').removeClass(options.class_active);
                                return $(this).parents('li').addClass(options.class_active).prevAll('li').addClass(options.class_active);
                            }
                        })
                        .on('mouseleave', function() {
                            if (!isDisabled) {
                                return setRating(options.rating);
                            }
                        })
                        .on('click', function() {
                        if (!isDisabled) {
                            var currentRating = $(this).parents('li').prevAll('li').length + 1;
                            options.onRatingChange.call(this, currentRating);
                            ngModelCtrl.$setViewValue(currentRating);
                            scope.$apply();
                            return false;
                        }
                    });
               
                setRating(options.rating);
                
                attrs.$observe('ngModel', function (value) {
                    scope.$watch(value, function (newValue) {
                        if (newValue) { setRating(newValue); }
                    });
                });
                attrs.$observe('disabled', function (value) {
                    scope.$watch(value,
                        function(newValue) {
                            if (newValue) {
                                isDisabled = true;
                                container.find('li a').removeClass("pointer").addClass("disabled");
                            }
                        });
                });
            }
        }
    }
]);

angular.module('directives').directive("mmScroll", [
    "$http", "$compile", function($http, $compile) {
        return {
            restrict: 'CA',
            link: function (scope, element, attrs, ctrl, transclude) {
                var height = 300;
                var slim = false;
                attrs.$observe('slim', function (value) {
                    slim = true;
                    if (value) {
                        height = value;
                        try {
                            $(element).slimScroll({ height: height, alwaysVisible: true, color: '#888', allowPageScroll: true });
                        } catch (ex) {

                        }
                    }
                });

                attrs.$observe('mmScroll', function (value) {
                    if (!slim) {
                        if (value) {
                            height = value;
                            $(element).css("height", function (index) {
                                return height;
                            });
                        }
                        $(element).css("overflow-y", "scroll");
                    }
                });

                attrs.$observe('height', function (value) {
                    if (value) {
                        height = value;
                        $(element).css("height", function(index) {
                            return height;
                        });}});

                

                //$(element).css("height", function (index) {
                //    return height;
                //});

                // overflow-y: scroll; /* has to be scroll, not auto */

                $(element).css(" -webkit-overflow-scrolling", "touch");
               
                // style = "overflow-y: scroll; height:400px;"
               
            }
        }
    }
]);
/**
 * Enhanced Select2 Dropmenus
 *
 * @AJAX Mode - When in this mode, your value will be an object (or array of objects) of the data used by Select2
 *     This change is so that you do not have to do an additional query yourself on top of Select2's own query
 * @params [options] {object} The configuration options passed to $.fn.select2(). Refer to the documentation
 */
angular.module('directives').value('mmSelect2Config', {}).directive('mmSelect2', ['mmSelect2Config', '$timeout', function (mmSelect2Config, $timeout) {
    var options = {};
    if (mmSelect2Config) {
        angular.extend(options, mmSelect2Config);
    }
    return {
        require: 'ngModel',
        priority: 1,
        compile: function (tElm, tAttrs) {
            var watch,
              repeatOption,
              repeatAttr,
              isSelect = tElm.is('select'),
              isMultiple = angular.isDefined(tAttrs.multiple);
            // Enable watching of the options dataset if in use
            if (tElm.is('select')) {
                repeatOption = tElm.find('optgroup[ng-repeat], optgroup[data-ng-repeat], option[ng-repeat], option[data-ng-repeat]');
                if (repeatOption.length) {
                    repeatAttr = repeatOption.attr('ng-repeat') || repeatOption.attr('data-ng-repeat');
                    watch = jQuery.trim(repeatAttr.split('|')[0]).split(' ').pop();
                }
            }

            return function (scope, elm, attrs, controller) {
                // instance-specific options
                var opts = angular.extend({}, options, scope.$eval(attrs.mmSelect2));
                /*  Convert from Select2 view-model to Angular view-model.  */
                var convertToAngularModel = function (select2_data) {
                    var model;
                    if (opts.simple_tags) {
                        model = [];
                        angular.forEach(select2_data, function (value, index) {
                            model.push(value.id);
                        });
                    } else {
                        model = select2_data;
                    }
                    return model;
                };
                /* Convert from Angular view-model to Select2 view-model. */
                var convertToSelect2Model = function (angular_data) {
                    var model = [];
                    if (!angular_data) {
                        return model;
                    }

                    if (opts.simple_tags) {
                        model = [];
                        angular.forEach(
                          angular_data,
                          function (value, index) {
                              model.push({ 'id': value, 'text': value });
                          });
                    } else {
                        model = angular_data;
                    }
                    return model;
                };

                if (isSelect) {
                    // Use <select multiple> instead
                    delete opts.multiple;
                    delete opts.initSelection;
                } else if (isMultiple) {
                    opts.multiple = true;
                }

                if (controller) {
                    // Watch the model for programmatic changes
                    scope.$watch(tAttrs.ngModel, function (current, old) {
                        if (!current) {
                            return;
                        }
                        if (current === old) {
                            return;
                        }
                        controller.$render();
                    }, true);
                    controller.$render = function () {
                        if (isSelect) {
                            elm.select2('val', controller.$viewValue);
                        } else {
                            if (opts.multiple) {
                                controller.$isEmpty = function (value) {
                                    return !value || value.length === 0;
                                };
                                var viewValue = controller.$viewValue;
                                if (angular.isString(viewValue)) {
                                    viewValue = viewValue.split(',');
                                }
                                elm.select2('data', convertToSelect2Model(viewValue));
                                if (opts.sortable) {
                                    elm.select2("container").find("ul.select2-choices").sortable({
                                        containment: 'parent',
                                        start: function () {elm.select2("onSortStart");},
                                        update: function () {elm.select2("onSortEnd"); elm.trigger('change');}
                                    });
                                }
                            } else {
                                if (angular.isObject(controller.$viewValue)) {
                                    elm.select2('data', controller.$viewValue);
                                } else if (!controller.$viewValue) {
                                    elm.select2('data', null);
                                } else {
                                    elm.select2('val', controller.$viewValue);
                                }
                            }
                        }
                    };

                    // Watch the options dataset for changes
                    if (watch) {
                        scope.$watch(watch, function (newVal, oldVal, scope) {
                            if (angular.equals(newVal, oldVal)) {
                                return;
                            }
                            // Delayed so that the options have time to be rendered
                            $timeout(function () {
                                elm.select2('val', controller.$viewValue);
                                // Refresh angular to remove the superfluous option
                                controller.$render();
                                if (newVal && !oldVal && controller.$setPristine) {
                                    controller.$setPristine(true);
                                }
                            });
                        });
                    }

                    // Update valid and dirty statuses
                    controller.$parsers.push(function (value) {
                        var div = elm.prev();
                        div
                          .toggleClass('ng-invalid', !controller.$valid)
                          .toggleClass('ng-valid', controller.$valid)
                          .toggleClass('ng-invalid-required', !controller.$valid)
                          .toggleClass('ng-valid-required', controller.$valid)
                          .toggleClass('ng-dirty', controller.$dirty)
                          .toggleClass('ng-pristine', controller.$pristine);
                        return value;
                    });

                    if (!isSelect) {
                        // Set the view and model value and update the angular template manually for the ajax/multiple select2.
                        elm.bind("change", function (e) {
                           e.stopImmediatePropagation();

                            if (scope.$$phase || scope.$root.$$phase) {
                                return;
                            }
                            scope.$apply(function () {
                                controller.$setViewValue(
                                  convertToAngularModel(elm.select2('data')));
                            });
                        });

                        if (opts.initSelection) {
                            var initSelection = opts.initSelection;
                            opts.initSelection = function (element, callback) {
                                initSelection(element, function (value) {
                                    var isPristine = controller.$pristine;
                                    controller.$setViewValue(convertToAngularModel(value));
                                    callback(value);
                                    if (isPristine) {
                                        controller.$setPristine();
                                    }
                                    elm.prev().toggleClass('ng-pristine', controller.$pristine);
                                });
                            };
                        }
                    }
                }

                elm.bind("$destroy", function () {
                    elm.select2("destroy");
                });

                attrs.$observe('disabled', function (value) {
                    elm.select2('enable', !value);
                });

                attrs.$observe('readonly', function (value) {
                    elm.select2('readonly', !!value);
                });

                if (attrs.ngMultiple) {
                    scope.$watch(attrs.ngMultiple, function (newVal) {
                        attrs.$set('multiple', !!newVal);
                        elm.select2(opts);
                    });
                }

                // Initialize the plugin late so that the injected DOM does not disrupt the template compiler
                $timeout(function () {
                    elm.select2(opts);

                    // Set initial value - I'm not sure about this but it seems to need to be there
                    elm.select2('data', controller.$modelValue);
                    // important!
                    controller.$render();

                    // Not sure if I should just check for !isSelect OR if I should check for 'tags' key
                    if (!opts.initSelection && !isSelect) {
                        var isPristine = controller.$pristine;
                        controller.$pristine = false;
                        controller.$setViewValue(
                            convertToAngularModel(elm.select2('data'))
                        );
                        if (isPristine) {
                            controller.$setPristine();
                        }
                        elm.prev().toggleClass('ng-pristine', controller.$pristine);
                    }
                });
            };
        }
    };
}]);
//<selection-modal selecteditem="currentItem.SupplierID" itemssource="suppliers" columns="['CompanyName','ContactTitle','ContactName']" valuefield="'SupplierID'" textfield="'CompanyName'"></selection-modal>
(function () {
    //---Required Bootstrap 3---//
    angular.module('directives').directive("mmSelectionModal", ["$http", "$compile", function ($http, $compile) {
        return {
            restrict: "E",
            transclude: true,
            template: "<div class='modalcontainer'>" +
              "<input class='btn btn-default' type='button' value='...'  ng-click='buttonclicked()'/>"+
                "<div class='modal fade' id='myModal' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>" +
    "<div class='modal-dialog modal-lg' style='max-height:100%' ><div class='modal-content'><div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>" +
                    "<h4 class='modal-title' id='myModalLabel'>{{title}}</h4></div><div class='modal-body'> <div class='filterhtml'></div> <div class='tablehtml'></div></div>" +
                "</div>",
            require: 'ngModel',
            scope: {
                itemssource: "=",
                itemTemplate: "=",
                columns: "=",
                valuefield: "@",
                textfield: "@",
                selecteditem: "=ngModel",
                message: "=",
                title:"@",
            },
            link: function (scope, element, attrs, ctrl, transclude) {
                var items = scope.itemssource;
                var q = scope.message;
                var filterhtml = $(".filter-template", element).html();
                if (!scope.filter) {scope.filter = {};}
                scope.$watch("filter.Name", function (newvalue) {
                    var data = newvalue;
                });
                transclude(scope, function(clone) {
                    angular.forEach(clone, function(elem) {
                        if (angular.element(elem).hasClass('filter-template')) {
                            filterhtml = "<div >" + elem.innerHTML + "</div>"
                        }
                    });
                });
                var tablehtml = function () {
                    scope.sort = "";
                    scope.descending = false;
                    scope.fieldnames = [];
                    scope.sortit = function (item) {
                        if (scope.sort == item) {
                            scope.descending = !scope.descending;
                        } else {
                            scope.descending = false;
                            scope.sort = item;
                        }
                    };
                    scope.linkclicked = function (item) {
                        if (item[scope.valuefield] != null) {scope.selecteditem = item[scope.valuefield]}
                        if (item[scope.textfield] != null) {var text = item[scope.textfield]}
                        $('.modal', element).modal('hide');
                    };
                    var rowtext = "";
                    var hash = window.location.hash
                    var tablehead = "";
                    for (var i = 0; i < scope.columns.length; i++) {
                        prop = scope.columns[i];
                        if (scope.sort == "") {scope.sort = prop;}
                        title = prop.replace("_", " ").split(/(?=[A-Z])/).join(" ");
                        rowtext += '<td><a href="" ng-click="linkclicked(item)"> <span style="font-size:14px" data-ng-bind="item.' + prop + '"></span></a> </td>';
                        tablehead += "<th><a ng-click='sortit(\"" + prop + "\")' >  <h4>" + title + "<h4/> <span ng-show='sort == \"" + prop + "\"' > <span ng-show='descending'> <i class='fa fa-caret-square-o-down'></i>  </span>  <span ng-hide='descending'> <i class='fa fa-caret-square-o-up'></i> </span>  </span>  </a> </th>"
                    }
                    var headertext = "<thead> <tr> " + tablehead + "</tr> </thead>"
                    var start = "<table class='table'>" + headertext + " <tbody> <tr data-ng-repeat='item in itemssource |orderBy:sort:descending |  filter:filter '>";
                    var full = start + rowtext + '  </tr> </tbody> </table>';
                    return full;
                }
                var modalFooter=""
                var filtercontainer = angular.element(element[0].getElementsByClassName("filterhtml")[0]);
                filtercontainer.append(filterhtml);
                var tablecontainer = angular.element(element[0].getElementsByClassName("tablehtml")[0]);
                tablecontainer.append(tablehtml());
                $compile(tablecontainer)(scope);
                $compile(filtercontainer)(scope);

                scope.buttonclicked = function () {$('.modal', element).modal('show');};
            },

            controller: function ($scope, $element, $attrs)
            {

            },
        };
    }]);
})();
//<selection-modal selecteditem="currentItem.SupplierID" itemssource="suppliers" columns="['CompanyName','ContactTitle','ContactName']" valuefield="'SupplierID'" textfield="'CompanyName'"></selection-modal>
(function () {
    //---Required Bootstrap 3---//
    angular.module('directives').directive("mmSelectionModalAjax", ["$http", "$compile", function ($http, $compile) {
        return {
            restrict: "E",
            scope: {
                itemTemplate: "=",
                columns: "=",
                valuefield: "=",
                textfield: "=",
                //filter: "=",
                selecteditem: "=",
                selectedText:"=",
                selectedId:"=",
                message: "=",
                url:"@",
            },
            link: function (scope, element, attrs) {

                var items = scope.itemssource;
                var q = scope.message;
                element.append('<div class="modalcontainer"></div>');
                var filterhtml = $(".filter-template", element).html();
                var modalcontainer = angular.element(element[0].getElementsByClassName("modalcontainer")[0]);
              

                var tablehtml = function () {
                    var rowtext = "";
                    var hash = window.location.hash
                    for (var i = 0; i < scope.columns; i++) {
                        prop = scope.columns[i];
                        if (scope.sort == "") {
                            scope.sort = prop;
                        }
                        scope.fieldnames.push({ 'fieldname': prop, 'title': prop.replace("_", " ").split(/(?=[A-Z])/).join(" ") });
                        rowtext += '<td><a href="" ng-click="linkclicked(item)"> <span style="font-size:14px" data-ng-bind="item.' + prop + '"></span></a> </td>';
                    }
                    var headertext = "<thead> <tr> <th ng-repeat='item in fieldnames'><a ng-click='sortit(item.fieldname)' > {{item.title}} <span ng-show='sort == item.fieldname' > <span ng-show='descending'> <i class='fa fa-caret-square-o-down'></i>  </span>  <span ng-hide='descending'> <i class='fa fa-caret-square-o-up'></i> </span>  </span>  </a> </th> </tr> </thead>";
                    var start = "<table class='table'>" + headertext + " <tbody> <tr data-ng-repeat='item in itemssource |orderBy:sort:descending |  filter:filter '>";
                   
                    var full = start + rowtext + '  </tr> </tbody> </table>';
                    return full;
                }
                //var select = "<select class='form-control' ng-model='selecteditem." + scope.valuefield + "' data-ng-options='c.Category_ID as c.Category_Name  for c in Categories'></select>";
                var triggerbutton = "<input class='btn btn-default' type='button' value='...'  ng-click='buttonclicked()'/>";
                var modalheader = "<div class='modal fade' id='myModal' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>" +
                "<div class='modal-dialog' style='max-height:100%' ><div class='modal-content'><div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>" +
                "<h4 class='modal-title' id='myModalLabel'>Modal title</h4></div><div class='modal-body'>";
                modalheader += '<div ng-show="dataloading" class="progress progress-striped active"><div class="progress-bar"  role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div>';
                var modelFilterPanel = "<div class='row'>" + filterhtml + "</div> <div class='row'><input ng-click='searchclicked()' value='Search' class='btn btn-default' type='button' /></div>"
                var modalBody = "<div ng-bind-html-unsafe='template'> " + tablehtml() + "</div></div>";
                //var modalFooter = "<div class='modal-footer'><button type='button' class='btn btn-default' data-dismiss='modal'>Close</button><button type='button' class='btn btn-primary'>Save changes</button></div></div></div></div>";
                var modalFooter=""

                var fullmodal = triggerbutton + modalheader + modelFilterPanel + modalBody + modalFooter;
                modalcontainer.append(fullmodal);
                $compile(modalcontainer)(scope);


             
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
               
                
                $scope.searchclicked = function () {
                    if ($scope.url && $scope.filter) {
                        $scope.dataloading = true;
                        $http.post($scope.url, $scope.filter)
                            .success(function (result) {
                                $scope.itemssource = result;
                                $scope.dataloading = false;
                            })
                            .error(function (data) {
                                $scope.dataloading = false;
                            })
                    }
                };
                $scope.sort = "";
                $scope.descending = false;
                $scope.fieldnames = [];
                $scope.sortit = function (item) {
                    if ($scope.sort == item) {
                        $scope.descending = !$scope.descending;
                    } else {
                        $scope.descending = false;
                        $scope.sort = item;
                    }
                };

                $scope.linkclicked = function (item) {
                    if (item[$scope.valuefield] != null) {
                        $scope.selecteditem = item[$scope.valuefield]
                    }
                    if (item[$scope.textfield] != null) {
                        var text = item[$scope.textfield]
                        if ($scope.selectedText) {
                            $scope.selectedText = item[$scope.textfield]
                        }
                    }
                    $('.modal', $element).modal('hide');
                };

                $scope.buttonclicked = function () {
                    $('.modal', $element).modal('show');
                };
            }]
        };
    }]);
})();
//<ul class="list-unstyled col-sm-12 sortable" itemssource="products.value" orderfield="ProductID">
(function () {
    //---Jquery IU required---//
    angular.module('directives').directive("mmSortable", ["$http", "$compile", function ($http, $compile) {
        return {
            restrict: "C",
            scope: {
                itemssource: "=",
                orderfield: "@",
                sorted:"&",
                handle:"@"
            },
            link: function (scope, element, attrs) {
                scope.dragStart = function (e, ui) {
                    ui.item.data('start', ui.item.index());
                }
                scope.dragEnd = function (e, ui) {
                    if (scope.orderfield) {
                        $.map($(this).children(), function (el) {
                            var itemscope = angular.element(el).scope()
                            var num = itemscope.item[scope.orderfield] = $(el).index() + 1;
                        });
                        scope.$apply(scope.itemssource);
                        sortedHandler = scope.sorted()
                        if (sortedHandler) {
                            sortedHandler(scope.itemssource);
                        }
                    } else {
                        var start = ui.item.data('start'),
                            end = ui.item.index();
                        scope.itemssource.splice(end, 0,
                            scope.itemssource.splice(start, 1)[0]);

                        sortedHandler = scope.sorted()
                        if (sortedHandler) {
                            sortedHandler(scope.itemssource);
                        }
                    }
                    scope.$apply();
                }
                var handlekey= '';
if(scope.handle){
  handlekey=scope.handle;
}
                $(element).sortable({
                handle:handlekey,
                    start: scope.dragStart,
                    update: scope.dragEnd
                })
                $(element).disableSelection()
            },
        };
    }]);
})();
angular.module('directives').directive("mmTable", ["$http", "$compile",  "$parse", function ($http, $compile,$parse) {
        return {
            restrict: "EA",
            transclude: true,
            template: "<table class='table'  tabindex = '0'><thead><tr class='headerholder'></tr></thead><tbody class='rowholder'></tbody></table> <input type='text' class='navinput' style='width: 0;height:0;overflow: hidden;padding:0;border:0' />" +
                "<div class='modalcontainer'></div>",
            link: function (scope, element, attrs, ctrl, transclude) {
                var rowholderNode = element.find("tbody.rowholder");
                var headerholderNode = element.find("tr.headerholder");
                var clearrowsandheaders =function() {
                    rowholderNode.empty();
                    headerholderNode.empty();
                }

                var childscope = scope.$new();
                var templatedata = "";
                var headertemplate = "";
                //will be removed
                var editTemplate = null;
                var detailTemplate = null;
                var deleteTemplate = null;
             
                //end of will be removed

         
                var modalcontainer = element.find("div.modalcontainer");
                var templatetable = element.find("table.table");
                transclude(childscope, function (clone) {
                    angular.forEach(clone, function (elem) {
                        //if (angular.element(elem).hasClass('create-template')) {
                        //    var createTemplate = elem.innerHTML; //createNode.append(createTemplate);
                        //}
                        if (angular.element(elem).hasClass('edit-template')) {
                             editTemplate = "<div class='edit-template'>" + elem.innerHTML +"</div>"
                        }
                        if (angular.element(elem).hasClass('detail-template')) {
                            detailTemplate = "<div class='detail-template'>" + elem.innerHTML +"</div>"
                        }
                        if (angular.element(elem).hasClass('delete-template')) { deleteTemplate = "<div class='delete-template'>" + elem.innerHTML +"</div>" }

                        if (angular.element(elem).hasClass('data-template')) {
                            var temp = $("td", elem).each(function (_, slide) {templatedata += "<td>" + slide.innerHTML + "</td>";});
                        }
                        //if (angular.element(elem).hasClass('header-template')) {
                        //   // var temp = $("th", elem).each(function (_, slide) { headertemplate += "<th>" + slide.innerHTML + "</th>"; });
                        //}
                    });
                    var h = angular.element(clone, "thead")
                    var temp = $("th", h).each(function(_, slide) {
                         headertemplate += "<th>" + slide.innerHTML + "</th>";
                    });
                    
                });

               // var items = scope.itemssource;
                var columns = null;//scope.columns;

                var createtable = function () {
                    var rowtext = "";
                    var linkpath = "";
                    var tablehead = ""
                    if (childscope.linkpath) {
                        linkpath = childscope.linkpath
                    } else {
                        linkpath = window.location.hash
                    }
                   
                    for (var i = 0; i < columns.length; i++) {
                        prop = columns[i];
                        if (scope.mmtableSort == "") { scope.mmtableSort = prop; }
                        title = prop.replace("_", " ").split(/(?=[A-Z])/).join(" ");
                        if (i == 0 && idfieldPropertyName) {
                            rowtext += '<td><a ng-href=' + linkpath + '/{{' + valueIdentifier + '.' + idfieldPropertyName + '}}> <span data-ng-bind="' + valueIdentifier + '.' + prop + '"></span></a> </td>';
                        } else {
                            rowtext += '<td><span data-ng-bind="' + valueIdentifier + '.' + prop + '"></span></td>';
                        }
                        tablehead += "<th><a class='pointer' ng-click='mmtableSortit(\"" + prop + "\")' > " + title + " <span ng-show='mmtableSort == \"" + prop + "\"' > <span ng-show='descending'> <i class='fa fa-caret-square-o-down'></i>  </span>  <span ng-hide='descending'> <i class='fa fa-caret-square-o-up'></i> </span>  </span>  </a> </th>"
                    }
                    if (templatedata != "") {
                        rowtext = templatedata;
                    }
                    if (headerholderNode && headerholderNode.length > 0) {
                        if (editTemplate || detailTemplate || deleteTemplate) {tablehead += "<th> Actions </th>"}
                        if (headertemplate != "") {
                            headerholderNode.append(headertemplate);
                        } else {
                            headerholderNode.append(tablehead);
                        }
                    }
                    if (rowholderNode && rowholderNode.length > 0) {
                        if (editTemplate || detailTemplate || deleteTemplate) {
                            rowtext += "<td><div class='btn-group'><button type='button' class='btn btn-primary dropdown-toggle' data-toggle='dropdown'>Actions <span class='caret'></span></button><ul class='dropdown-menu' role='menu'>";
                            if (detailTemplate) { rowtext += "<li><a ng-click='mmtablebtnDetailItem(" + valueIdentifier + ")'>Detail</a></li>"; }
                            if (editTemplate) { rowtext += "<li><a ng-click='mmtablebtnSaveItem(" + valueIdentifier + ")'>Edit</a></li>"; }
                            if (deleteTemplate) { rowtext += "<li class='divider'></li> <li><a ng-click='mmtablebtnDeleteItem(" + valueIdentifier + ")'>Delete</a></li></ul></div></td>"; }
                        }
                        if (ngrepeatattr) {
                            var fullrowtext = "<tr data-ng-class='{ \"active\":mmtableIntSelectedItem ==" + valueIdentifier + "}'  ng-click='mmtableSelected(" + valueIdentifier + ")' ng-attr-cursor='{{mmtablecursor}}'  data-ng-repeat='" + ngrepeatattr + "'>" + rowtext + "</tr>";
                        } else {
                            var fullrowtext = "<tr data-ng-class='{ \"active\":mmtableIntSelectedItem ==" + valueIdentifier + "}'  ng-click='mmtableSelected(" + valueIdentifier + ")' ng-attr-cursor='{{mmtablecursor}}'  data-ng-repeat='" + valueIdentifier + " in " + itemssourcePropertyName + " |orderBy:mmtableSort:descending |  filter : mmtableFilter'  >" + rowtext + "</tr>";
                        }
                        rowholderNode.append(fullrowtext);
                    }
                    //var modal = "";
                    //if (editTemplate || detailTemplate || deleteTemplate) {
                    //    modal = CreateModal();
                   // }
                   // var full = modal;
                   // tablecontainer.append($compile(full)(scope))
                    //$compile(element.contents())(childscope);
                    $compile(templatetable)(childscope);
                    
                };
                
                //controller Actions
                var firstime = true;
                var itemssourcePropertyName =null
                var idfieldPropertyName = null;
                var itemselectedHandler = null;
                var selecteditemPropertyName = null;
                //Events
                attrs.$observe('itemselected', function (value) {
                    if (value && scope[value] && angular.isFunction(scope[value])) {
                        itemselectedHandler = scope[value];
                    }
                });
             
                // End of events

                var ngrepeatattr = null;
                var valueIdentifier = "item";
                var expression = attrs.mmTable;
                if (expression) {
                    var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
                    if (!match) { throw ('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.", expression); }
                    var lhs = match[1];
                    var rhs = match[2];
                    var aliasAs = match[3];
                    var trackByExp = match[4];
                    match = lhs.match(/^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/);
                    if (!match) { throw ('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.", lhs); }
                    valueIdentifier = match[3] || match[1];
                    ngrepeatattr = attrs.mmTable;
                }
                if (rhs) {
                    itemssourcePropertyName = rhs;
                    scope.$watch(itemssourcePropertyName, function (newVal, oldVal) {
                        if (newVal && !columns) {
                            if (newVal && newVal[0]) {
                                columns = [];
                                for (prop in newVal[0]) {
                                    columns.push(prop);
                                }
                                createtable();
                            }
                        }
                    });

                }

                attrs.$observe('itemssource', function (value) {
                    itemssourcePropertyName = value;
                    scope.$watch(value, function (newVal, oldVal) {
                        if (newVal && !columns) {
                            if (newVal && newVal[0]) {
                                columns = [];
                                for (prop in newVal[0]) {
                                    columns.push(prop);
                                }
                                createtable();
                            }
                        }
                    });
                });
              
                //attrs.$observe('selecteditem', function (value) {
                //    selecteditemPropertyName = value;
                //    scope.$watch(value, function (newvalue) {
                //        if (newvalue) {
                //            if (newvalue !== childscope.mmtableIntSelectedItem) {
                //                childscope.mmtableIntSelectedItem = newvalue;
                //            }
                //        } else if (selecteditemPropertyName) {
                //            scope[selecteditemPropertyName] = {};
                //        }
                //    });

                //});
                var parsedNgModel = $parse(attrs.selecteditem),
            parsedNgModelAssign = parsedNgModel.assign,
            ngModelGet = parsedNgModel,
            ngModelSet = parsedNgModelAssign;

                attrs.$observe('tableClass', function (value) {
                    if (value) {
                        $(templatetable).addClass(value);
                    }
                });

                attrs.$observe('filter', function (value) {
                    scope.$watch(value, function(newValue, oldVal) {
                        childscope.mmtableFilter = newValue;
                    });
                });

                attrs.$observe('linkpath', function (value) {
                    childscope.linkpath = value;

                    //scope.$watch(value, function (newValue, oldVal) {
                    //    childscope.linkpath = newValue;
                    //});

                });

                attrs.$observe('columns', function (value) {
                    scope.$watch(value, function (newValue, oldVal) {
                        if (newValue && (newValue != oldVal || firstime)) {
                            firstime = false;
                            clearrowsandheaders();
                            columns = newValue;
                            createtable();
                        }
                    });
                });

                attrs.$observe('idfield', function (value) {
                    idfieldPropertyName = value;
                });

                
                childscope.mmtableSort = "";
                childscope.descending = false;
                childscope.mmtablecursor = "auto";

                childscope.mmtableSortit = function (item) {
                    if (childscope.mmtableSort == item) {
                        childscope.descending = !childscope.descending;
                    } else {
                        childscope.descending = false;
                        childscope.mmtableSort = item;
                    }
                };
                childscope.mmtableSelected = function (item) {
                    childscope.mmtablecursor = "hand";
                    if (childscope.mmtableIntSelectedItem != item) {
                        childscope.mmtableIntSelectedItem = item;
                    }
                    if (itemselectedHandler) {
                        itemselectedHandler(item);
                    }

                    if (ngModelSet) {
                        ngModelSet(scope, item);
                    }
                    //if (selecteditemPropertyName) {
                       
                    //        scope[selecteditemPropertyName] = item;
                       
                    //}
                };


                //Modal Actions
                var detailClickedHandler = null;
                var saveClickedHandler = null;
                var deleteClickedHandler = null;

                detailClickedHandler = $parse(attrs['detailClicked'], /* interceptorFn */ null, /* expensiveChecks */ true);
                saveClickedHandler = $parse(attrs['saveClicked'], /* interceptorFn */ null, /* expensiveChecks */ true);
                deleteClickedHandler = $parse(attrs['deleteClicked'], /* interceptorFn */ null, /* expensiveChecks */ true);

                //attrs.$observe('detailClicked', function (value) {
                //    if (value && scope[value] && angular.isFunction(scope[value])) { detailClickedHandler = scope[value]; }
                //});
                //attrs.$observe('saveClicked', function (value) {
                //    if (value && scope[value] && angular.isFunction(scope[value])) {saveClickedHandler = scope[value]; }
                //});
                //attrs.$observe('deleteClicked', function (value) {
                //    if (value && scope[value] && angular.isFunction(scope[value])) { deleteClickedHandler = scope[value];}
                //});
                if (editTemplate || detailTemplate || deleteTemplate) {
                    var actionModal = "<mm-action-modal selecteditem='mmtableselecteditem' calldetail='mmtablecalldetail' detail-clicked='mmtabledetailClicked'" +
                        "calledit='mmtablecalledit' save-clicked='mmtableSaveClicked' " + "calldelete='mmtablecalldelete' delete-clicked='mmtabledeleteClicked'>" +
                        editTemplate + detailTemplate + deleteTemplate + "</mm-action-modal>";
                    modalcontainer.append(actionModal);
                    $compile(modalcontainer)(childscope);
                }

                childscope.mmtablebtnDetailItem = function (item) {
                    childscope.mmtableselecteditem = item;
                    childscope.mmtablecalldetail = true;
                    if (detailClickedHandler && detailClickedHandler(scope) && angular.isFunction(detailClickedHandler(scope))) { detailClickedHandler(scope)(childscope.mmtableselecteditem); }
                };
                childscope.mmtablebtnSaveItem = function (item) {
                    childscope.originalitem = item;
                    childscope.mmtableselecteditem = angular.copy(item);
                    childscope.mmtablecalledit = true;
                };
                childscope.mmtableSaveClicked = function (item) {
                    angular.copy(item, childscope.originalitem);
                    if (saveClickedHandler && saveClickedHandler(scope) && angular.isFunction(saveClickedHandler(scope))) { saveClickedHandler(scope)(childscope.originalitem); }
                };

                childscope.mmtablebtnDeleteItem = function (item) {childscope.mmtableselecteditem = item; childscope.mmtablecalldelete = true; };
                childscope.mmtabledeleteClicked = function (item) {
                    if (deleteClickedHandler && deleteClickedHandler(scope) && angular.isFunction(deleteClickedHandler(scope))) { deleteClickedHandler(scope)(item); }
                };


                element.bind("keydown keypress", function (event) {
                    if (lhs) {
                        var valuename = lhs;
                    }
                    else {
                        var valuename = "item";
                    }

                    if (event.which === 38) {
                        event.preventDefault();
                        var selected = $(".active", element);
                        if (selected.prev().length == 0) {
                            selected.siblings().last().addClass("selected");
                        } else {
                            var scopee = $(".active", element).prev().scope()[valuename];
                            if (scopee) {

                                //$("body").animate({
                                //    scrollTop: $(".active", element).prev().offset().top
                                //}, 0);

                                scope.$apply(function () {
                                    childscope.mmtableSelected(scopee);
                                });
                            }
                        }
                       
                        return false;
                    }
                    else if (event.which === 40) {
                        event.preventDefault();
                        var selected = $(".active", element);
                        if (selected.next().length == 0) {
                            selected.siblings().last().addClass("selected");
                        } else {
                            var scopee = $(".active", element).next().scope()[valuename];
                            if (scopee) {
                                //$("body").animate({
                                //    scrollTop: $(".active", element).next().offset().top
                                //}, 0);

                                scope.$apply(function () {
                                    childscope.mmtableSelected(scopee);
                                });
                            }
                        }
                        return false;
                    }
                });

                //$(element).click(function () {
                //    $('.navinput', element).focus();
                //});

                //element.bind('keydown', keydown);
                //function keydown(e) {
                //    if (e.keyCode == 13) { // enter
                //        if ($(".services").is(":visible")) {
                //            selectOption();
                //        } else {
                //            $(".services").show();
                //        }
                //        menuOpen = !menuOpen;
                //    }
                //    if (e.keyCode == 38) { // up
                //        var selected = $(".active", element);
                //        if (selected.prev().length == 0) {
                //            selected.siblings().last().addClass("selected");
                //        } else {

                //            var scopee = $(".active", element).prev().scope()[lhs];
                //            if (scopee) {
                //                scope.$apply(function () {
                //                    childscope.itemclicked(scopee);
                //                });
                //            }
                //        }
                //    }
                //    if (e.keyCode == 40) { // down
                //        var selected = $(".active", element);
                //        if (selected.next().length == 0) {
                //            var scopee = $(".active", element).first().scope()[lhs];
                //            if (scopee) {
                //                scope.$apply(function () {
                //                    childscope.itemclicked(scopee);
                //                });
                //            }
                //        } else {
                //            var scopee = $(".active", element).next().scope()[lhs];
                //            if (scopee) {

                //                //$(element).animate({
                //                //    scrollTop: $(".active", element).next().offset().top
                //                //}, 0);


                //                scope.$apply(function () {
                //                    childscope.itemclicked(scopee);
                //                });
                //            }
                //        }
                //    }
                //};
            },


           
           

            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
               

               

 
            }],

        };
    }]);
(function () {
    angular.module('directives').directive("mmTableSorter", ["$http", "$compile", function ($http, $compile) {
        return {
            //restrict: "E",
            //transclude: true,
            scope: {
                sort: "=",
                columns: "=",
                descending: "=",
            },
            link: function (scope, element, attrs) {
                var columns = scope.columns;
                var createtable = function () {
                    scope.sort = "";
                    scope.descending = false;
                    scope.fieldnames = [];
                    scope.sortit = function (item) {
                        if (scope.sort == item) {
                            scope.descending = !scope.descending;
                        } else {
                            scope.descending = false;
                            scope.sort = item;
                        }
                    };
                    for (var i = 0; i < columns.length; i++) {
                        prop = columns[i];
                        if (scope.sort == "") {
                            scope.sort = prop;
                        }
                        scope.fieldnames.push({ 'fieldname': prop, 'title': prop.replace("_", " ").split(/(?=[A-Z])/).join(" ") });
                    }
                    var headertext = "<thead class='tablecontainer'><tr> <th ng-repeat='item in fieldnames'><a ng-click='sortit(item.fieldname)' > {{item.title}} <span ng-show='sort == item.fieldname' > <span ng-show='descending'> <i class='fa fa-caret-square-o-down'></i>  </span>  <span ng-hide='descending'> <i class='fa fa-caret-square-o-up'></i> </span>  </span>  </a> </th> </tr></thead>";
                    var full = headertext;


                    $(element).append(headertext);
                    var tablecontainer = angular.element(element[0].getElementsByClassName("tablecontainer")[0]);
                    $compile(tablecontainer)(scope);
                };

                //if (columns != null) {
                //    scope.$watch("columns", function (newVal, oldVal) {
                //        tablecontainer.empty();
                //        columns = scope.columns;
                //        createtable();
                //    });
                //}
                createtable();
            },
            controller: function ($scope, $element, $attrs) {
                
            },
           
        };
    }]);
})();
/*
 * Properties : itemssource: Array
 */
(function () {
    angular.module("directives").directive("mmTimelineCol", ["$compile", function ($compile) {
        return {
            restrict: 'E',
            replace: true,
            template: '<ul class="timeline-2col"></ul>',
            transclude: true,
            link: function (scope, element, attrs, ctrl, transclude) {
                var itemssourcePropertyName = null
                var create = function () {
                    var template = "";
                    transclude(scope, function (clone) {
                        template = "";
                        angular.forEach(clone, function (elem) { if (elem.outerHTML) { template += elem.outerHTML; } });
                    });
                    if (template) {
                        var templatefull = '<li class="mytemplate" ng-class-even="\'timeline-inverted\'" ng-repeat="item in ' + itemssourcePropertyName + '">' +
                            '<div class="timeline-badge primary"><i ng-class-even="\'glyphicon glyphicon-record invert\'" ng-class-odd="\'glyphicon glyphicon-record\'"></i></div>' +
                            '<div>' + template + '</div> </li>   <li class="clearfix" style="float: none;"></li>';
                        element.append($compile(templatefull)(scope))
                    }
                }
                attrs.$observe('itemssource', function (value) {
                    itemssourcePropertyName = value;
                    create();
                });
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {}],
        }
    }]);

    angular.module("directives").directive("mmTimeline", ["$compile", function ($compile) {
        return {
            restrict: 'E',
            replace: true,
            template: '<ul class="timeline-v2"></ul>',
            transclude: true,
            link: function (scope, element, attrs, ctrl, transclude) {
                var itemssourcePropertyName = null
                var create = function () {
                    var template = "";
                    transclude(scope, function (clone) {
                        template = "";
                        angular.forEach(clone, function(elem) {if (elem.outerHTML) {template += elem.outerHTML;}});
                    });
                    if (template) {
                        var templatefull = '<li ng-repeat="item in ' + itemssourcePropertyName + '"> <i class="cbp_tmicon rounded-x hidden-xs"></i> <div>' + template + '</div></li>';
                        element.append($compile(templatefull)(scope))
                    }
                }
                attrs.$observe('itemssource', function (value) {
                    itemssourcePropertyName = value;
                    create();
                });
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {}],
        }
    }]);
})();
angular.module('directives')

.constant('timepickerConfig', {
    hourStep: 1,
    minuteStep: 1,
    showMeridian: true,
    meridians: null,
    readonlyInput: false,
    mousewheel: true
})

.controller('TimepickerController', ['$scope', '$attrs', '$parse', '$log', '$locale', 'timepickerConfig', function ($scope, $attrs, $parse, $log, $locale, timepickerConfig) {
    var selected = new Date(),
        ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
        meridians = angular.isDefined($attrs.meridians) ? $scope.$parent.$eval($attrs.meridians) : timepickerConfig.meridians || $locale.DATETIME_FORMATS.AMPMS;

    this.init = function (ngModelCtrl_, inputs) {
        ngModelCtrl = ngModelCtrl_;
        ngModelCtrl.$render = this.render;

        var hoursInputEl = inputs.eq(0),
            minutesInputEl = inputs.eq(1);

        var mousewheel = angular.isDefined($attrs.mousewheel) ? $scope.$parent.$eval($attrs.mousewheel) : timepickerConfig.mousewheel;
        if (mousewheel) {
            this.setupMousewheelEvents(hoursInputEl, minutesInputEl);
        }

        $scope.readonlyInput = angular.isDefined($attrs.readonlyInput) ? $scope.$parent.$eval($attrs.readonlyInput) : timepickerConfig.readonlyInput;
        this.setupInputEvents(hoursInputEl, minutesInputEl);
    };

    var hourStep = timepickerConfig.hourStep;
    if ($attrs.hourStep) {
        $scope.$parent.$watch($parse($attrs.hourStep), function (value) {
            hourStep = parseInt(value, 10);
        });
    }

    var minuteStep = timepickerConfig.minuteStep;
    if ($attrs.minuteStep) {
        $scope.$parent.$watch($parse($attrs.minuteStep), function (value) {
            minuteStep = parseInt(value, 10);
        });
    }

    // 12H / 24H mode
    $scope.showMeridian = timepickerConfig.showMeridian;
    if ($attrs.showMeridian) {
        $scope.$parent.$watch($parse($attrs.showMeridian), function (value) {
            $scope.showMeridian = !!value;

            if (ngModelCtrl.$error.time) {
                // Evaluate from template
                var hours = getHoursFromTemplate(), minutes = getMinutesFromTemplate();
                if (angular.isDefined(hours) && angular.isDefined(minutes)) {
                    selected.setHours(hours);
                    refresh();
                }
            } else {
                updateTemplate();
            }
        });
    }

    // Get $scope.hours in 24H mode if valid
    function getHoursFromTemplate() {
        var hours = parseInt($scope.hours, 10);
        var valid = ($scope.showMeridian) ? (hours > 0 && hours < 13) : (hours >= 0 && hours < 24);
        if (!valid) {
            return undefined;
        }

        if ($scope.showMeridian) {
            if (hours === 12) {
                hours = 0;
            }
            if ($scope.meridian === meridians[1]) {
                hours = hours + 12;
            }
        }
        return hours;
    }

    function getMinutesFromTemplate() {
        var minutes = parseInt($scope.minutes, 10);
        return (minutes >= 0 && minutes < 60) ? minutes : undefined;
    }

    function pad(value) {
        return (angular.isDefined(value) && value.toString().length < 2) ? '0' + value : value;
    }
    // Respond on mousewheel spin
    this.setupMousewheelEvents = function (hoursInputEl, minutesInputEl) {
        var isScrollingUp = function (e) {
            if (e.originalEvent) {
                e = e.originalEvent;
            }
            //pick correct delta variable depending on event
            var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
            return (e.detail || delta > 0);
        };

        hoursInputEl.bind('mousewheel wheel', function (e) {
            $scope.$apply((isScrollingUp(e)) ? $scope.incrementHours() : $scope.decrementHours());
            e.preventDefault();
        });

        minutesInputEl.bind('mousewheel wheel', function (e) {
            $scope.$apply((isScrollingUp(e)) ? $scope.incrementMinutes() : $scope.decrementMinutes());
            e.preventDefault();
        });

    };

    this.setupInputEvents = function (hoursInputEl, minutesInputEl) {
        if ($scope.readonlyInput) {
            $scope.updateHours = angular.noop;
            $scope.updateMinutes = angular.noop;
            return;
        }

        var invalidate = function (invalidHours, invalidMinutes) {
            ngModelCtrl.$setViewValue(null);
            ngModelCtrl.$setValidity('time', false);
            if (angular.isDefined(invalidHours)) {
                $scope.invalidHours = invalidHours;
            }
            if (angular.isDefined(invalidMinutes)) {
                $scope.invalidMinutes = invalidMinutes;
            }
        };

        $scope.updateHours = function () {
            var hours = getHoursFromTemplate();

            if (angular.isDefined(hours)) {
                selected.setHours(hours);
                refresh('h');
            } else {
                invalidate(true);
            }
        };

        hoursInputEl.bind('blur', function (e) {
            if (!$scope.invalidHours && $scope.hours < 10) {
                $scope.$apply(function () {
                    $scope.hours = pad($scope.hours);
                });
            }
        });

        $scope.updateMinutes = function () {
            var minutes = getMinutesFromTemplate();

            if (angular.isDefined(minutes)) {
                selected.setMinutes(minutes);
                refresh('m');
            } else {
                invalidate(undefined, true);
            }
        };

        minutesInputEl.bind('blur', function (e) {
            if (!$scope.invalidMinutes && $scope.minutes < 10) {
                $scope.$apply(function () {
                    $scope.minutes = pad($scope.minutes);
                });
            }
        });

    };

    this.render = function () {
        var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;

        if (isNaN(date)) {
            ngModelCtrl.$setValidity('time', false);
            $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
        } else {
            if (date) {
                selected = date;
            }
            makeValid();
            updateTemplate();
        }
    };

    // Call internally when we know that model is valid.
    function refresh(keyboardChange) {
        makeValid();
        ngModelCtrl.$setViewValue(new Date(selected));
        updateTemplate(keyboardChange);
    }

    function makeValid() {
        ngModelCtrl.$setValidity('time', true);
        $scope.invalidHours = false;
        $scope.invalidMinutes = false;
    }

    function updateTemplate(keyboardChange) {
        var hours = selected.getHours(), minutes = selected.getMinutes();

        if ($scope.showMeridian) {
            hours = (hours === 0 || hours === 12) ? 12 : hours % 12; // Convert 24 to 12 hour system
        }

        $scope.hours = keyboardChange === 'h' ? hours : pad(hours);
        $scope.minutes = keyboardChange === 'm' ? minutes : pad(minutes);
        $scope.meridian = selected.getHours() < 12 ? meridians[0] : meridians[1];
    }

    function addMinutes(minutes) {
        var dt = new Date(selected.getTime() + minutes * 60000);
        selected.setHours(dt.getHours(), dt.getMinutes());
        refresh();
    }

    $scope.incrementHours = function () {
        addMinutes(hourStep * 60);
    };
    $scope.decrementHours = function () {
        addMinutes(-hourStep * 60);
    };
    $scope.incrementMinutes = function () {
        addMinutes(minuteStep);
    };
    $scope.decrementMinutes = function () {
        addMinutes(-minuteStep);
    };
    $scope.toggleMeridian = function () {
        addMinutes(12 * 60 * ((selected.getHours() < 12) ? 1 : -1));
    };
}])

.directive('mmtimepicker', function () {
    return {
        restrict: 'EA',
        require: ['mmtimepicker', '?^ngModel'],
        controller: 'TimepickerController',
        replace: true,
        scope: {},
        template: "<table>" +
            "<tbody>" +
            "<tr class='text-center'>" +
            "<td><a ng-click='incrementHours()' class='btn btn-outline btn-link' style='border: 0px; border-image: none;'><i class='fa fa-angle-up fa-2x'></i></a></td>" +
            "<td>&nbsp;</td>" +
            "<td><a ng-click='incrementMinutes()' class='btn btn-outline btn-link btn-default' style='border: 0px; border-image: none;'><i class='fa fa-angle-up fa-2x'></i></a></td>" +
            "<td ng-show='showMeridian'></td>" +
            "</tr>" +
            "<tr>" +
            "<td style='width:50px;' class='form-group' ng-class=\"{'has-error': invalidHours}\">" +
            "<input type='text' ng-model='hours' ng-change='updateHours()' class='form-control text-center' ng-mousewheel='incrementHours()' ng-readonly='readonlyInput'  min='0' max='23'>" +
            "</td>" +
            "<td>:</td>" +
            "<td style='width:50px;' class='form-group' ng-class=\"{'has-error': invalidMinutes}\">" +
            "<input type='text' ng-model='minutes' ng-change='updateMinutes()' class='form-control text-center' ng-readonly='readonlyInput' min='0' max='59'>" +
            "</td>" +
            "<td ng-show='showMeridian'><button type='button' class='btn btn-outline btn-default text-center' ng-click='toggleMeridian()'>{{meridian}}</button></td>" +
            "</tr>" +
            "<tr class='text-center'>" +
            "<td><a ng-click='decrementHours()' class='btn btn-outline btn-link' style='border: 0px; border-image: none;'><i class='fa fa-angle-down fa-2x'></i></a></td>" +
            "<td>&nbsp;</td>" +
            "<td><a ng-click='decrementMinutes()' class='btn btn-outline btn-link' style='border: 0px; border-image: none;'><i class='fa fa-angle-down fa-2x'></a></td>" +
            "<td ng-show='showMeridian'></td>" +
            "</tr>" +
            "</tbody>" +
            "</table>",
        link: function (scope, element, attrs, ctrls) {
            var timepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

            if (ngModelCtrl) {
                timepickerCtrl.init(ngModelCtrl, element.find('input'));
            }
        }
    };
});
angular.module('directives')
    .value('uiTinymceConfig', {})
    .directive('mmTinymce', ['uiTinymceConfig', function (uiTinymceConfig) {
        uiTinymceConfig = uiTinymceConfig || {};
        var generatedIds = 0;
        return {
            priority: 10,
            require: '?ngModel',
            link: function (scope, elm, attrs, ngModel) {
                var expression, options, tinyInstance;
                // generate an ID if not present
                if (!attrs.id) {
                    attrs.$set('id', 'uiTinymce' + generatedIds++);
                }
                options = {
                    // Update model when calling setContent (such as from the source editor popup)
                    setup: function (ed) {
                        ed.on('init', function (args) {
                            ngModel.$render();
                        });
                        // Update model on button click
                        ed.on('ExecCommand', function (e) {
                            ed.save();
                            ngModel.$setViewValue(elm.val());
                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                        // Update model on keypress
                        ed.on('KeyUp', function (e) {
                            //console.log(ed.isDirty());
                            //ed.save();
                            //ngModel.$setViewValue(elm.val());
                            //if (!scope.$$phase) {
                            //    scope.$apply();
                            //}
                        });
                        ed.on("Change",function (e) {
                           // console.log(ed.isDirty());
                            ed.save();
                                ngModel.$setViewValue(elm.val());
                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                    },
                    mode: 'exact',
                    elements: attrs.id
                };
                if (attrs.uiTinymce) {
                    expression = scope.$eval(attrs.uiTinymce);
                } else {
                    expression = {};
                }
                angular.extend(options, uiTinymceConfig, expression);
                setTimeout(function () {
                    options.plugins = 'advlist autolink link image lists charmap print preview code';
                    tinymce.init(options);
                });


                ngModel.$render = function () {
                   // console.log("render");
                    if (!tinyInstance) {
                        tinyInstance = tinymce.get(attrs.id);
                    }
                    if (tinyInstance) {
                        tinyInstance.setContent(ngModel.$viewValue || '');
                    }
                };
            }
        };
    }]);






//    .directive('wysihtml5', ['$timeout',
//function ($timeout) {
//    return {
//        restrict: 'E',
//        require: 'ngModel',
//        template: "<textarea></textarea>", // A template you create as a HTML file (use templateURL) or something else...
//        link: function ($scope, $element, attrs, ngModel) {

//            // Find the textarea defined in your Template
//            var textarea = $element.find("textarea");

//            // When your model changes from the outside, use ngModel.$render to update the value in the textarea
//            ngModel.$render = function () {
//                textarea.val(ngModel.$viewValue);
//            };

//            // Create the editor itself, use TinyMCE in your case
//            var editor = new wysihtml5.Editor(textarea[0],
//                {
//                    stylesheets: ["/style.css"],
//                    parserRules: wysihtml5ParserRules,
//                    toolbar: true,
//                    autoLink: true,
//                    useLineBreaks: false,
//                });

//            // Ensure editor is rendered before binding to the change event
//            $timeout(function () {

//                // On every change in the editor, get the value from the editor (textarea in case of Wysihtml5)
//                // and set your model
//                editor.on('change', function () {
//                    var newValue = textarea.val();

//                    if (!$scope.$$phase) {
//                        $scope.$apply(function () {
//                            ngModel.$setViewValue(newValue);
//                        });
//                    }
//                });

//            }, 500);
//        }
//    };
//}]);
//<mm-treeview itemssource="assemb" selected-id="selectidid" nullvalue="'749'" selectedtext="selectedText" idfield="ComponentID" textfield="ComponentName" parentfield="ProductAssemblyID"></mm-treeview>
/*
                                 <mm-treeview itemssource="productAssembly" selected-id="selectidid" nullvalue="productID" selectedtext="selectedText" idfield="ComponentID"  parentfield="ProductAssemblyID">
                                    <div class="data-template">
                                        <table class=" table table-bordered">
                                            <tr>
                                                <td>{{ node.ComponentName }}</td>
                                                <td>Qty : {{node.PerAssemblyQty }}</td>
                                            </tr>
                                        </table>
                                    </div>
                                </mm-treeview>
  
 */

(function () {
    //---Jquery IU required---//
    angular.module('directives').directive('mmTreeview', ["$compile", function ($compile) {
        return {
            template: '<ul class="uiTree"></ul>',
            replace: true,
            transclude: true,
            restrict: 'E',
            scope: {
                itemssource: '=',
                parentnodeid: '@',
                parentfield: "@",
                idfield: '@',
                textfield: '@',
                selectedtext: '=',
                //tree: '=ngModel',
                nullvalue: '=',

                //loadFn: '=',
                //expandTo: '=',
                selectedId: '=',
                selecteditem: '=ngModel',
            },
            link: function (scope, element, attrs, ctrl, transclude) {
                var treecontrol = element[0];//.find("ul");
                var datatemplate = "";
            transclude(scope, function (clone) {angular.forEach(clone, function (elem) {
            if (angular.element(elem).hasClass('data-template')) {
                datatemplate ="<div class='data-template''>" + elem.innerHTML + "</div>";
            }});});
            element.append('<mm-treeview-node ng-repeat="node in tree">' + datatemplate + '</mm-treeview-node>');
            $compile(element.contents())(scope);
            },

            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {

                $attrs.$observe("ngModel", function (value) {
                    if (value && !$scope.selecteditem) {
                        $scope.selecteditem = {};
                    }
                });

                $scope.$on("nodeSelected", function (event, node) {
                    $scope.$broadcast("selectNode", node);
                    if ($scope.selectedId) {
                        $scope.selectedId = node[$scope.idfield];
                    }
                    if ($scope.selectedtext) {
                        $scope.selectedtext = node[$scope.textfield];
                    }

                    if ($scope.selecteditem) {
                        $scope.selecteditem = node;
                    }
                });

                var findtheparent = function (id) {
                    var item = _.find($scope.itemssource, function (parentittem) { return (id == parentittem[$scope.idfield]) });

                    var parentids = id;

                    var findtheparentrec = function (item) {
                        if (item[$scope.parentfield]) {
                            parentids = item[$scope.parentfield] + "," + parentids;
                            var parent = _.find($scope.itemssource, function (parentittem) { return (item[$scope.parentfield] == parentittem[$scope.idfield]) });
                            if (parent) { findtheparentrec(parent) }
                        } else { return parentids; }
                    }
                    if (item) {
                        findtheparentrec(item);
                    }
                    return parentids;
                }

                $scope.$watch("itemssource", function (newVal, oldVal) {
                    drawtreeview();
                });

                $scope.$watch("nullvalue", function (newVal, oldVal) {
                    if (newVal) {
                        drawtreeview();
                    }
                });

                var drawtreeview = function () {
                    if ($scope.itemssource && $scope.itemssource.length && $scope.itemssource.length > 0) {
                        if ($scope.parentnodeid) {
                            var items = _.filter($scope.itemssource, function (item) { return item[$scope.parentfield] == $scope.parentnodeid });
                            $scope.tree = items;
                        } else {
                            if ($scope.nullvalue) {
                                var items = _.filter($scope.itemssource, function (item) {
                                    return item[$scope.parentfield] == $scope.nullvalue
                                });
                            } else {
                                var items = _.filter($scope.itemssource, function (item) { return item[$scope.parentfield] == null });
                            }
                            $scope.tree = items;
                        }

                        // TODO expandTo shouldn't be two-way, currently we're copying it
                        if (!$scope.expandTo) {
                            if (!$scope.selectedId) {
                                $scope.selectedId = {}
                            }
                            $scope.expandTo = findtheparent($scope.selectedId);
                        }
                        if ($scope.expandTo && $scope.expandTo.length) {
                            $scope.expansionNodes = angular.copy($scope.expandTo);
                            var arrExpandTo = $scope.expansionNodes.split(",");
                            $scope.nextExpandTo = arrExpandTo.shift();
                            $scope.expansionNodes = arrExpandTo.join(",");
                        }
                    }

                }
            }]
        };
    }])
.directive('mmTreeviewNode', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: 'E',
        replace: true,
        //template: '<li>' +
        //          '<div style="clear: both;" class="node" data-node-id="{{ nodeId() }}">' +
        //            '<a style="float: left;width:24px" class="icon" ng-click="toggleNode(nodeId())""></a>' +
        //            '<a style="float: left;" ng-hide="selectedId" ng-href="#/assets/{{ nodeId() }}">{{ node.name }}</a>' +
        //            '<span style="float: left" ng-show="selectedId" ng-class="css()" ng-click="setSelected(node)">' +
        //'<div style="float: left;" class="templateholder"></div>' +
        //    '{{ node[textfield] }}</span>' +
        //          '</div>' +
        //        '</li>',

        template: '<li>' +
          '<div style="clear: both;" class="node" data-node-id="{{ nodeId() }}">' +
            '<a style="float: left;width:24px" class="icon" ng-click="toggleNode(nodeId())""></a>' +
            '<a style="float: left;" ng-hide="selectedId" ng-href="#/assets/{{ nodeId() }}">{{ node.name }}</a>' +
            '<span style="float: left" ng-show="selectedId" ng-class="css()" ng-click="setSelected(node)">' +
            '<div style="float: left;" class="templateholder"></div>' +
                '{{ node[textfield] }}</span>' +
          '</div>' +
        '</li>',
        transclude: true,
        link: function (scope, elm, attrs, ctrl, transclude) {
            var template = null;
            transclude(scope, function (clone) {
                angular.forEach(clone, function (elem) {
                    if (angular.element(elem).hasClass('data-template')) {
                        var templateholder =  elm.find("div.templateholder");

                        template = elem.innerHTML;
                        
                        elm.append($compile(templateholder.append(elem.innerHTML))(scope))
                        // datatemplate.append(elem.innerHTML);
                    }
                });
            });

            scope.nodeId = function (node) {
                var localNode = node || scope.node;
                return localNode[scope.idfield];
            };
            scope.nodehaschildren = function () {
                var q = _.find(scope.itemssource, function (item) {
                    return scope.nodeId() == item[scope.parentfield]
                })
                if (q) return true;
                else return false;
            };

            scope.toggleNode = function (nodeId) {
                var isVisible = elm.children(".uiTree:visible").length > 0;
                var childrenTree = elm.children(".uiTree");
                if (isVisible) {
                    scope.$emit('nodeCollapsed', nodeId);
                } else if (nodeId) {
                    scope.$emit('nodeExpanded', nodeId);
                }
                if (!isVisible && childrenTree.length === 0) {
                    if (scope.tree) {
                        var id = scope.node[scope.idfield]

                        var content = _.find(scope.itemssource, function (item) { return item[scope.parentfield] == id })
                        if (content) {
                            scope.appendChildren();
                            elm.find("a.icon i").show();
                            elm.find("a.icon img").remove();
                            scope.toggleNode(); // show it
                        }
                    }
                } else {
                    childrenTree.toggle(!isVisible);
                    elm.find("a.icon i").toggleClass("fa fa-chevron-right");
                    elm.find("a.icon i").toggleClass("fa fa-chevron-down");
                }
            };

            scope.appendChildren = function () {
                // Add children by $compiling and doing a new ui-tree directive
                // We need the load-fn attribute in there if it has been provided
                var childrenHtml = '<mm-treeview parentnodeid="' + scope.node[scope.idfield] + '" itemssource="itemssource" idfield="' +
                    scope.idfield + '"';
                // pass along all the variables
                if (scope.expansionNodes) {
                    childrenHtml += ' expand-to="expansionNodes"';
                }
                if (scope.selectedId) {
                    childrenHtml += ' selected-id="selectedId"';
                }
                if (scope.parentfield) {
                    childrenHtml += ' parentfield="' + scope.parentfield + '"';
                }

                if (scope.textfield) {
                    childrenHtml += ' textfield="' + scope.textfield + '"';
                }
               
                //if (scope.selectedtext) {
                //    childrenHtml += ' selectedtext=""';
                //}

                childrenHtml += ' style="display: none">';
                if (template) {
                    childrenHtml += "<div class='data-template''>" + template + "</div>"
                }
                childrenHtml += '</mm-treeview>';
                return elm.append($compile(childrenHtml)(scope));
            };

            scope.css = function () {
                return {
                    nodeLabel: true,
                    selected: scope.selectedId && scope.nodeId() === scope.selectedId
                };
            };
            // emit an event up the scope.  Then, from the scope above this tree, a "selectNode"
            // event is expected to be broadcasted downwards to each node in the tree.
            // TODO this needs to be re-thought such that the controller doesn't need to manually
            // broadcast "selectNode" from outside of the directive scope.
            scope.setSelected = function (node) {
                scope.$emit("nodeSelected", node);
            };

            scope.$on("selectNode", function (event, node) {
                scope.selectedId = scope.nodeId(node);
            });
            if (scope.nodehaschildren()) {
                // if (scope.node.hasChildren) {
                elm.find("a.icon").append('<i class="fa fa-chevron-right"></i>');
                // }
            }

            if (scope.nextExpandTo && scope.nodeId() == parseInt(scope.nextExpandTo, 10)) {
                scope.toggleNode(scope.nodeId());
            }
        }
    };
}]);

})();



angular.module('directives').directive('mmValidator', [
    function() {
        return{
            restrict: 'A',
            require: '^form',
            link: function (scope, elm, attrs, formCtrl) {
                var blurred, inputEl, inputName, inputNgEl, options, showSuccess, trigger;
                var errorMessages = null;
                var helpertext = null;
                var pretexted=false;
                showSuccess = true;
                inputEl = elm[0].querySelector('input[name]');
                if (!inputEl) {
                    inputEl = elm[0].querySelector('select[name]');
                }

                var numberMaxLength = "";
                if (inputEl.maxLength) {
                    numberMaxLength = inputEl.maxLength;
                }
                var numberMinLength = "";
                if (inputEl.minlength) {
                    numberMaxLength = inputEl.minlength;
                }
                var numbermax = "";
                if (inputEl.max) {
                    numbermax = inputEl.max;
                }

                var numbermin =""
                if (inputEl.min) {
                    numbermax = inputEl.min;
                }

                attrs.$observe('minlength', function (val) {
                    minlength = parseInt(val, 10);
                });

                inputNgEl = angular.element(inputEl);
                inputName = inputNgEl.attr('name');
                if (!inputName) {
                    throw "show-errors element has no child input elements with a 'name' attribute";
                }
                inputNgEl.bind('blur', function () {
                    blurred = true;
                    loadErrors();
                });

                inputNgEl.bind('invalid', function() {
                    loadErrors();
                });
                elm.toggleClass('has-none', true);
                
              var q =  {'required':'can not be empty','email':'requires valid email'}

                attrs.$observe('mmValidator', function (value) {
                    if (value) {
                        if (value.indexOf('{') > -1) {
                            var newvalue = value.replace(/'/g, "\"");
                            errorMessages = JSON.parse(newvalue);
                            elm.append('<p class="help-block"></p>');
                            helpertext = elm.find("p.help-block");
                            if (helpertext[0]) {
                                helpertext = helpertext[0];
                            } else {
                                helpertext = null;
                            }

                        } else {
                            pretexted = true;
                            elm.append('<p class="help-block">' + value + '</p>');
                        }
                    } else {
                        if (!helpertext) {
                            elm.append('<p class="help-block"></p>');
                            helpertext = elm.find("p.help-block");
                            if (helpertext[0]) {
                                helpertext = helpertext[0];
                            } else {
                                helpertext = null;
                            }
                        }
                    }
                });

              
                var loadErrors =function() {
                    var error = formCtrl[inputName].$error;
                    if (!pretexted) {
                        if (error['email']) {
                            if (errorMessages && errorMessages['email']) {
                                helpertext.innerHTML = errorMessages['email'];
                            } else {
                                helpertext.innerHTML = "Please enter a valid e-mail address";
                            }
                        } else if (error['max']) {
                            if (errorMessages && errorMessages['max']) {
                                helpertext.innerHTML = errorMessages['max'];
                            } else {
                                helpertext.innerHTML = "Please enter less than " + numbermax;
                            }
                        } else if (error['maxlength']) {
                            if (errorMessages && errorMessages['maxlength']) {
                                helpertext.innerHTML = errorMessages['maxlength'];
                            } else {
                                helpertext.innerHTML = "Please enter at maximum "+numberMaxLength+" characters.";
                            }
                        } else if (error['min']) {
                            if (errorMessages && errorMessages['min']) {
                                helpertext.innerHTML = errorMessages['min'];
                            } else {
                                helpertext.innerHTML = "Please enter more than " + numbermin;
                            }
                        } else if (error['minlength']) {
                            if (errorMessages && errorMessages['minlength']) {
                                helpertext.innerHTML = errorMessages['minlength'];
                            } else {
                                helpertext.innerHTML = "Please enter at least " + numberMinLength + " characters.";
                            }
                        } else if (error['number']) {
                            if (errorMessages && errorMessages['number']) {
                                helpertext.innerHTML = errorMessages['number'];
                            } else {
                                helpertext.innerHTML = "input must be a number";
                            }
                        } else if (error['pattern']) {
                            if (errorMessages && errorMessages['pattern']) {
                                helpertext.innerHTML = errorMessages['pattern'];
                            } else {
                                helpertext.innerHTML = "pattern isn't exceeded";
                            }
                        } else if (error['required']) {
                            if (errorMessages && errorMessages['required']) {
                                helpertext.innerHTML = errorMessages['required'];
                            } else {
                                helpertext.innerHTML = "input can not be empty";
                            }
                        } else if (error['url']) {
                            if (errorMessages && errorMessages['url']) {
                                helpertext.innerHTML = errorMessages['url'];
                            } else {
                                helpertext.innerHTML = "input must be a url";
                            }
                        } else if (error['date']) {
                            if (errorMessages && errorMessages['date']) {
                                helpertext.innerHTML = errorMessages['date'];
                            } else {
                                helpertext.innerHTML = "input must be a date";
                            }
                        } else if (error['datetimelocal']) {
                            if (errorMessages && errorMessages['datetimelocal']) {
                                helpertext.innerHTML = errorMessages['datetimelocal'];
                            } else {
                                helpertext.innerHTML = "input must be a datetimelocal";
                            }
                        } else if (error['time']) {
                            if (errorMessages && errorMessages['time']) {
                                helpertext.innerHTML = errorMessages['time'];
                            } else {
                                helpertext.innerHTML = "input must be a time";
                            }
                        } else if (error['week']) {
                            if (errorMessages && errorMessages['week']) {
                                helpertext.innerHTML = errorMessages['week'];
                            } else {
                                helpertext.innerHTML = "input must be a week";
                            }
                        } else if (error['month']) {
                            if (errorMessages && errorMessages['month']) {
                                helpertext.innerHTML = errorMessages['month'];
                            } else {
                                helpertext.innerHTML = "input must be a month";
                            }
                        } else {
                            helpertext.innerHTML = "";
                        }
                    }
                    return toggleClasses(formCtrl[inputName].$invalid);
                }

                var toggleClasses = function (invalid) {
                    elm.toggleClass('has-error', invalid);
                    elm.toggleClass('has-none', !invalid);
                    if (showSuccess) {
                        return elm.toggleClass('has-success', !invalid);
                    }
                };

              
                //scope.$watch(function () {
                //    var field = inputName;
                //    return formCtrl[inputName] && formCtrl[inputName].$invalid;
                //},
               // function (invalid) {
               //     if (!blurred) {
               //         return;
               //     }
               //     return toggleClasses(invalid);
               // });

            }
        }
    }
]);
angular.module('directives').directive("mmWizard", ["$http", "$compile", function ($http, $compile) {
        return {
            restrict: "C",
            transclude: true,
            template: '<div class="wizard ui-wizard-example"><div class="wizard-wrapper"><ul class="wizard-steps" id="myTab" style="left: 0px;">' +
                '</ul></div>  ' +
                '<div class="wizard-content panel tab-content">' +
                '<div style="display: none;" class="alert alert-danger alert-dark"> <button class="close" type="button" >×</button> <span class="alert-message">Change a few things up and try submitting again.</span> </div>' +
                '</div>' +
                '<div class="panel-footer"><button class="btn wizard-prev-step-btn">Prev</button><button class="btn btn-primary wizard-next-step-btn pull-right">Next</button> <button class="btn btn-primary wizard-finish-step-btn pull-right">Finish</button></div>' +
                '</div>',
            link: function(scope, element, attrs, ctrl, transclude) {

                function s4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                }

                var formPrefix = s4();

                //maybe childscope is nessesary
                var stepheader = element.find("ul.wizard-steps");
                var contentholder = element.find("div.wizard-content");
                var prevBtn = element.find("button.wizard-prev-step-btn");
                var frvBtn = element.find("button.wizard-next-step-btn");
                var finishBtn = element.find("button.wizard-finish-step-btn");
                var buttonpanel = element.find('div.panel-footer');
                var alertcontainer = element.find('div.alert');
                var alertmeassagecontainer = element.find('span.alert-message');
                var alertClose = element.find('button.close');
                var steps = [];
                var stepnumber = 0;
                var activenumber = 0;

                $(contentholder).on('keyup', function (e) {
                    if (e.which == 13) {
                        goForward();
                        // e.preventDefault();
                    }
                });

                var clearrowsandheaders = function () {

                }
                var showAlert = function(message)
                {
                    alertcontainer[0].style.display = "block";
                    alertmeassagecontainer[0].innerHTML = message;
                }
                var hideAlert= function() {
                    alertcontainer[0].style.display = "none";
                }

                var stepchangedCall= function() {
                    var q = scope["form" + formPrefix + (activenumber + 1)];
                    var cancelled = false;
                    if (q.$valid) {
                        if (stepChangedHandler) {
                            var args = {};
                            args.CurrentPage = (activenumber + 1);
                            args.targetedPage = activenumber;
                            args.formName = "form" + formPrefix + (activenumber + 1);
                            args.form = q;
                            cancelled = stepChangedHandler(args);
                        }
                    } else {
                        var form = q.$error;
                        cancelled = true;
                        showAlert("Check validations");
                    }
                    return cancelled;
                }
                var goForward =function() {
                    if ((activenumber+1) < stepnumber) {
                        if (!stepchangedCall()) {
                            activenumber++;
                            $('#myTab li:eq(' + activenumber + ')', element).tab('show');
                            prevBtn[0].style.display = "inline-block";
                            if (activenumber + 1 == stepnumber) { frvBtn[0].style.display = "none"; }
                            if (activenumber + 1 == stepnumber) { finishBtn[0].style.display = "inline-block"; }
                            hideAlert();
                        }
                    }
                }
                $(alertClose).bind("click", function () {
                    hideAlert();
                });

                $(finishBtn).bind("click", function() {

                    var cancelled = false;
                    var q = scope["form" + formPrefix + (activenumber + 1)];
                    if (q.$valid) {

                        var args = {};
                        args.CurrentPage = (activenumber + 1);
                        args.targetedPage = null;
                        args.formName = "form" + formPrefix + (activenumber + 1);
                        args.form = q;
                        if (finishClickedHandler) {cancelled = finishClickedHandler(args);}
                        if (stepChangedHandler) {cancelled = stepChangedHandler(args);}

                        if (!cancelled) {
                            contentholder[0].style.display = "none";
                            buttonpanel[0].style.display = "none";
                            $('#myTab li:last',element)[0].style.backgroundColor = "#4cb64c";
                            $('#myTab li:last .wizard-step-caption', element)[0].style.color = "white";
                            $('#myTab li:last .wizard-step-description', element)[0].style.color = "white";
                            hideAlert();
                        }
                    } else {
                        showAlert("Check validations");
                    }
                });

                $(prevBtn).bind("click", function () {
                    frvBtn[0].style.display = "inline-block";
                    finishBtn[0].style.display = "none";
                    if (activenumber > 0) {
                        if (!stepchangedCall()) {
                            activenumber--;
                            $('#myTab li:eq(' + activenumber + ')', element).tab('show');
                            hideAlert();
                            if (activenumber == 0) {
                                prevBtn[0].style.display = "none";
                            }
                        }
                    }
                });

                $(frvBtn).bind("click", function() {
                    goForward();
                });


                var stepChangedHandler = null;
                attrs.$observe('stepChanged', function (value) {
                    if (value && scope[value] && angular.isFunction(scope[value])) {
                        stepChangedHandler = scope[value];
                    }
                });
                var finishClickedHandler = null;
                attrs.$observe('finishClicked', function (value) {
                    if (value && scope[value] && angular.isFunction(scope[value])) {
                        finishClickedHandler = scope[value];
                    }
                });


              
                var getsubcontent = function (innerhtml) {
                    var output = {};
                    var caption = $(innerhtml).find(".wizard-caption");
                    if (caption && caption[0] && caption[0].innerHTML) {
                        //output.caption = caption[0].innerHTML;
                        output.caption = '<li class="active"  style="width: 200px; min-width: 200px; max-width: 200px;" data-target="#wizard-example-step' + stepnumber + '" data-toggle="tab" >' +
                            '<span class="wizard-step-number">' + stepnumber + '</span><span class="wizard-step-caption">' + caption[0].innerHTML + '</span> </li>';
                        stepheader.append(output.caption);

                    }
                    var content = $(innerhtml).find(".wizard-content");
                    if (content && content[0] && content[0].innerHTML) {
                        //output.content = content[0].innerHTML;
                        output.content = ' <div id="wizard-example-step' + stepnumber + '" class="tab-pane"><form name="form' + formPrefix + stepnumber + '" class="form' + stepnumber + '">' + content[0].innerHTML + '</form></div>';
                        contentholder.append(output.content);

                    }
                    var buttons = $(innerhtml).find("wizard-buttons");
                    if (buttons && buttons[0] && buttons[0].innerHTML) {
                        output.buttons = buttons[0].innerHTML;
                    }
                    return output;
                }


                transclude(scope, function(clone) {
                    angular.forEach(clone, function (elem) {
                        if (angular.element(elem).hasClass('wizard-step')) {
                            stepnumber++;
                            steps.push(getsubcontent(elem));
                        }
                    });
                    $('#myTab li:first').tab('show');
                    prevBtn[0].style.display = "none";
                    finishBtn[0].style.display = "none";
                    $compile(contentholder)(scope);
                    //var h = angular.element(clone, "thead");
                   
                });
            }
        }
        }]);
angular.module('directives')
    .constant('mmSwitcherConfig', {
        theme: null,
        on_state_content: 'ON',
        off_state_content: 'OFF'
    })
    .directive("mmSwitcher", [
        "$http", "$compile", "mmSwitcherConfig", function ($http, $compile, mmSwitcherConfig) {
            return {
                restrict: 'ACM',
                require: 'ngModel',
                transclude: true,
                link: function (scope, element, attrs, ctrl, transclude) {
                    var $el = $(element);
                    var box_class;
                    if (attrs.options == null) {
                        attrs.options = {};
                    } else {
                        attrs.options = scope.$eval(attrs.options) ? scope.$eval(attrs.options) : attrs.options;
                    }
                    if (attrs.theme) {
                        attrs.options.theme = attrs.theme ? attrs.theme : scope.$eval(attrs.theme);
                    }
                    var options = $.extend({}, mmSwitcherConfig, attrs.options);
                    var $checkbox = null;
                    var $box = null;
                    if ($el.is('input[type="checkbox"]')) {
                        box_class = $el.attr('data-class');
                        $checkbox = $el;
                        $box = $('<div class="switcher"><div class="switcher-toggler"></div><div class="switcher-inner"><div class="switcher-state-on">' + options.on_state_content + '</div><div class="switcher-state-off">' + options.off_state_content + '</div></div></div>');
                        if (options.theme) {
                            $box.addClass('switcher-theme-' + options.theme);
                        }
                        if (box_class) {
                            $box.addClass(box_class);
                        }
                        $box.insertAfter($checkbox).prepend($checkbox);
                    } else {
                        $box = $el;
                        $checkbox = $('input[type="checkbox"]', $box);
                    }
                    if ($checkbox.prop('disabled')) {
                        $box.addClass('disabled');
                    }
                    if ($checkbox.is(':checked')) {
                        $box.addClass('checked');
                    }
                    $checkbox.on('click', function (e) {
                        return e.stopPropagation();
                    });
                    $box.on('touchend click', (function (_this) {
                        return function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            return toggle(_this);
                        };
                    })(this));

                    var toggle = function (control) {
                        $checkbox.click();
                    };
                    var on = function () {
                        $checkbox[0].checked = true;
                        return $box.addClass('checked');
                    }
                    var off = function () {
                        $checkbox[0].checked = false;
                        return $box.removeClass('checked');
                    }

                    attrs.$observe('ngModel', function (value) {
                        scope.$watch(value, function (newValue) {
                            if (newValue) {
                                on();
                            } else {
                                off();
                            }
                        });
                    });
                }
            }
        }
    ]);
angular.module("directives").directive("popover", [function () {
    return {
        restrict: 'ACM',
        link: function (scope, element) {
            $(element).popover(
                { trigger: 'focus' }
                );
        }
    }
}])
angular.module('directives').directive('themeSelector', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs, ngModelCtrl) {
            var selectedtheme = null;

            attrs.$observe('themeSelector', function (value) {
              
                if (value == "theme-adminflare" || value == "theme-asphalt" || value == "theme-clean" || value == "theme-default" || value == "theme-dust"
                    || value == "theme-fresh" || value == "theme-frost" || value == "theme-purple-hills" || value == "theme-silver" || value == "theme-white") {
                    selectedtheme = value;

                }

               


            });

            var $elem = $(elem);
            $elem.bind("click", function () {
                if (selectedtheme) {
                    var body = angular.element(document).find('body');
                    $(body).removeClass("theme-adminflare theme-asphalt theme-clean theme-default theme-dust theme-fresh theme-frost theme-purple-hills theme-silver theme-white");
                    $(body).addClass(selectedtheme);
                }
            });
        }
    };
});
angular.module('directives')
    .directive("tooltip", [
        "$http", "$compile", function ($http, $compile) {
            return {
                restrict: 'AC',
                link: function (scope, element, attrs, ctrl, transclude) {
                    if ($(element).tooltip) {
                        $(element).tooltip();
                    }
        },
    }
}
]);
(function () {
    angular.module('component').constant('alertDefaults', {
        type: 'warning',
        close_btn: true,
        classes: false,
        namespace: 'pa_page_alerts',
        animate: true,
        auto_close: false
    }).factory('alertService', ["alertDefaults", function (alertDefaults) {
     var   alertsContainerId = 'pa-page-alerts-box';
        var  typesHash = {
            warning: '',
            danger: 'alert-danger',
            success: 'alert-success',
            info: 'alert-info'
        };
        /* Add new alert.         * @param  {String} html     * @param  {Object} options */
        var add = function (html, options, type, autoClose) {
            var $alert, $alerts, $box, height, paddingBottom, paddingTop;
            options = $.extend({}, alertDefaults, options || {});
            if (type != null) {options.type = type;}
            if (autoClose != null && jQuery.isNumeric && jQuery && jQuery.isNumeric(autoClose)) {
                options['auto_close'] = autoClose;
            }
            $alert = $('<div class="alert alert-page ' + options.namespace + ' ' + typesHash[options.type] + '" />').html(html);
            if (options.classes) { $alert.addClass(options.classes);            }
            if (options.close_btn) {
                $alert.prepend($('<button type="button" data-dismiss="alert" class="close" />').html('&times;'));
            }
            if (options.animate) {                $alert.attr('data-animate', 'true');            }
            $box = $('#' + alertsContainerId);
            if (!$box.length) {
                if ($('#alert-wrapper').length) {
                    $box = $('<div id="' + alertsContainerId + '" />').prependTo($('#alert-wrapper'));
                } else {
                    $box = $('<div id="' + alertsContainerId + '" />').prependTo($('body'));
                }
            } 
            $alerts = $('#' + alertsContainerId + ' .' + options.namespace);
            height = $alert.css({
                visibility: 'hidden',
                position: 'absolute',
                width: '100%'
            }).appendTo('body').outerHeight();
            paddingTop = $alert.css('padding-top');
            paddingBottom = $alert.css('padding-bottom');
            if (options.animate) {
                $alert.attr('style', '').css({
                    overflow: 'hidden',
                    height: 0,
                    'padding-top': 0,
                    'padding-bottom': 0
                });
            }
            if ($alerts.length) {
                $alerts.last().after($alert);
            } else {
                $box.append($alert);
            }
            if (options.animate) {
                return $alert.animate({
                    'height': height,
                    'padding-top': paddingTop,
                    'padding-bottom': paddingBottom
                }, 500, (function () {
                    return function () {
                        $alert.attr('style', '');
                        if (options.auto_close) {
                            return $.data($alert, 'timer', setTimeout(function () {
                                return close($alert);
                            }, options.auto_close * 1000));
                        }
                    };
                })(this));
            } else {
                return $alert.attr('style', '');
            }
        };

        var addDark = function(html, options, type,autoClose) {
            options = $.extend({}, alertDefaults, options || {});
            options.namespace = 'pa_page_alerts_dark';
            options.classes = 'alert-dark'; // add custom classes
            add(html, options, type,autoClose);
        };
        

        var addMoveTop = function (html, options, type, autoClose) {
            $('html,body').animate({ scrollTop: 0 }, 500);
            setTimeout(function () {
                add(html, options, type, autoClose);

            }, 800);
        }
        var addMoveTopDark = function (html, options, type, autoClose) {
            $('html,body').animate({ scrollTop: 0 }, 500);
            setTimeout(function () {
                addDark(html, options, type, autoClose);
            }, 800);
        }

        /* Close alert. @param  {jQuery Object} $alert          */

       var close = function ($alert) {
            if ($alert.attr('data-animate') === 'true') {
                return $alert.animate({
                    'height': 0,
                    'padding-top': 0,
                    'padding-bottom': 0
                }, 500, function () {
                    if ($.data($alert, 'timer')) {
                        clearTimeout($.data($alert, 'timer'));
                    }
                    return $alert.remove();
                });
            } else {
                if ($.data($alert, 'timer')) {
                    clearTimeout($.data($alert, 'timer'));
                }
                return $alert.remove();
            }
        };

        /* Close all alerts with specified namespace.     * @param  {Boolean} animate    * @param  {String} namespace         */

       var clear = function (animate, namespace) {
            var $alerts, self;
            if (animate == null) {
                animate = true;
            }
            if (namespace == null) {
                namespace = 'pa_page_alerts';
            }
            $alerts = $('#' + alertsContainerId + ' .' + namespace);
            if ($alerts.length) {
                self = this;
                if (animate) {
                    return $alerts.each(function () {
                        return self.close($(this));
                    });
                } else {
                    return $alerts.remove();
                }
            }
       };


        /* Close all alerts.         * @param  {Boolean} animate        */

        var clearAll = function (animate) {
            var self;
            if (animate == null) {
                animate = true;
            }
            if (animate) {
                self = this;
                return $('#' + alertsContainerId + ' .alert').each(function () {
                    return self.close($(this));
                });
            } else {
                return $('#' + alertsContainerId).remove();
            }
        };


        var AddSoundElement= function() {
            $('body').append('<audio style="display: none;" id="notificationSound" preload src="/NotificationSounds/sounds-882-solemn.mp3"></audio>');
        }
        AddSoundElement();

        var MakeSound = function (sound) {
            var soundfile = "/NotificationSounds/tick.mp3";
            switch (sound) {
            case "bell":
                soundfile = "/NotificationSounds/bell.mp3";
                break;
            case "harp":
                soundfile = "/NotificationSounds/harp.mp3";
                break;
                case "error":
                    soundfile = "/NotificationSounds/error.mp3";
                    break;
                case "no":
                    soundfile = "/NotificationSounds/no.mp3";
                    break;
                case "notify":
                    soundfile = "/NotificationSounds/notify.mp3";
                    break;
                case "success":
                    soundfile = "/NotificationSounds/success.mp3";
                    break;
                case "tick":
                    soundfile = "/NotificationSounds/tick.mp3";
                    break;
                case "warning":
                    soundfile = "/NotificationSounds/warning.mp3";
                    break;
                case "alien":
                    soundfile = "/NotificationSounds/alien.mp3";
                    break;
                case "cricket":
                    soundfile = "/NotificationSounds/cricket.mp3";
                    break;
                case "echo":
                    soundfile = "/NotificationSounds/echo.mp3";
                    break;
                case "knob":
                    soundfile = "/NotificationSounds/knob.mp3";
                    break;
            default:
            }
            var aud = document.getElementById("notificationSound");
            aud.src = soundfile;
            aud.play();
        }

        return {
            add: add,
            addDark:addDark,
            close: close,
            clear: clear,
            addMoveTop: addMoveTop,
            addMoveTopDark: addMoveTopDark,
            clearAll: clearAll,
            MakeSound: MakeSound,
        }


    }]);
})();
(function () {

    angular.module('data').factory('gravatarService', [function () {



      var CryptoJS=CryptoJS||function(o,q){var l={},m=l.lib={},n=m.Base=function(){function a(){}return{extend:function(e){a.prototype=this;var c=new a;e&&c.mixIn(e);c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.$super.extend(this)}}}(),j=m.WordArray=n.extend({init:function(a,e){a=
this.words=a||[];this.sigBytes=e!=q?e:4*a.length},toString:function(a){return(a||r).stringify(this)},concat:function(a){var e=this.words,c=a.words,d=this.sigBytes,a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)e[d+b>>>2]|=(c[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<c.length)for(b=0;b<a;b+=4)e[d+b>>>2]=c[b>>>2];else e.push.apply(e,c);this.sigBytes+=a;return this},clamp:function(){var a=this.words,e=this.sigBytes;a[e>>>2]&=4294967295<<32-8*(e%4);a.length=o.ceil(e/4)},clone:function(){var a=
n.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var e=[],c=0;c<a;c+=4)e.push(4294967296*o.random()|0);return j.create(e,a)}}),k=l.enc={},r=k.Hex={stringify:function(a){for(var e=a.words,a=a.sigBytes,c=[],d=0;d<a;d++){var b=e[d>>>2]>>>24-8*(d%4)&255;c.push((b>>>4).toString(16));c.push((b&15).toString(16))}return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d+=2)c[d>>>3]|=parseInt(a.substr(d,2),16)<<24-4*(d%8);return j.create(c,b/2)}},p=k.Latin1={stringify:function(a){for(var b=
a.words,a=a.sigBytes,c=[],d=0;d<a;d++)c.push(String.fromCharCode(b[d>>>2]>>>24-8*(d%4)&255));return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d++)c[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return j.create(c,b)}},h=k.Utf8={stringify:function(a){try{return decodeURIComponent(escape(p.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return p.parse(unescape(encodeURIComponent(a)))}},b=m.BufferedBlockAlgorithm=n.extend({reset:function(){this._data=j.create();
    this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=h.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var b=this._data,c=b.words,d=b.sigBytes,f=this.blockSize,i=d/(4*f),i=a?o.ceil(i):o.max((i|0)-this._minBufferSize,0),a=i*f,d=o.min(4*a,d);if(a){for(var h=0;h<a;h+=f)this._doProcessBlock(c,h);h=c.splice(0,a);b.sigBytes-=d}return j.create(h,d)},clone:function(){var a=n.clone.call(this);a._data=this._data.clone();return a},_minBufferSize:0});m.Hasher=b.extend({init:function(){this.reset()},
        reset:function(){b.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);this._doFinalize();return this._hash},clone:function(){var a=b.clone.call(this);a._hash=this._hash.clone();return a},blockSize:16,_createHelper:function(a){return function(b,c){return a.create(c).finalize(b)}},_createHmacHelper:function(a){return function(b,c){return f.HMAC.create(a,c).finalize(b)}}});var f=l.algo={};return l}(Math);
        (function(o){function q(b,f,a,e,c,d,g){b=b+(f&a|~f&e)+c+g;return(b<<d|b>>>32-d)+f}function l(b,f,a,e,c,d,g){b=b+(f&e|a&~e)+c+g;return(b<<d|b>>>32-d)+f}function m(b,f,a,e,c,d,g){b=b+(f^a^e)+c+g;return(b<<d|b>>>32-d)+f}function n(b,f,a,e,c,d,g){b=b+(a^(f|~e))+c+g;return(b<<d|b>>>32-d)+f}var j=CryptoJS,k=j.lib,r=k.WordArray,k=k.Hasher,p=j.algo,h=[];(function(){for(var b=0;64>b;b++)h[b]=4294967296*o.abs(o.sin(b+1))|0})();p=p.MD5=k.extend({_doReset:function(){this._hash=r.create([1732584193,4023233417,
        2562383102,271733878])},_doProcessBlock:function(b,f){for(var a=0;16>a;a++){var e=f+a,c=b[e];b[e]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360}for(var e=this._hash.words,c=e[0],d=e[1],g=e[2],i=e[3],a=0;64>a;a+=4)16>a?(c=q(c,d,g,i,b[f+a],7,h[a]),i=q(i,c,d,g,b[f+a+1],12,h[a+1]),g=q(g,i,c,d,b[f+a+2],17,h[a+2]),d=q(d,g,i,c,b[f+a+3],22,h[a+3])):32>a?(c=l(c,d,g,i,b[f+(a+1)%16],5,h[a]),i=l(i,c,d,g,b[f+(a+6)%16],9,h[a+1]),g=l(g,i,c,d,b[f+(a+11)%16],14,h[a+2]),d=l(d,g,i,c,b[f+a%16],20,h[a+3])):48>a?(c=
        m(c,d,g,i,b[f+(3*a+5)%16],4,h[a]),i=m(i,c,d,g,b[f+(3*a+8)%16],11,h[a+1]),g=m(g,i,c,d,b[f+(3*a+11)%16],16,h[a+2]),d=m(d,g,i,c,b[f+(3*a+14)%16],23,h[a+3])):(c=n(c,d,g,i,b[f+3*a%16],6,h[a]),i=n(i,c,d,g,b[f+(3*a+7)%16],10,h[a+1]),g=n(g,i,c,d,b[f+(3*a+14)%16],15,h[a+2]),d=n(d,g,i,c,b[f+(3*a+5)%16],21,h[a+3]));e[0]=e[0]+c|0;e[1]=e[1]+d|0;e[2]=e[2]+g|0;e[3]=e[3]+i|0},_doFinalize:function(){var b=this._data,f=b.words,a=8*this._nDataBytes,e=8*b.sigBytes;f[e>>>5]|=128<<24-e%32;f[(e+64>>>9<<4)+14]=(a<<8|a>>>
        24)&16711935|(a<<24|a>>>8)&4278255360;b.sigBytes=4*(f.length+1);this._process();b=this._hash.words;for(f=0;4>f;f++)a=b[f],b[f]=(a<<8|a>>>24)&16711935|(a<<24|a>>>8)&4278255360}});j.MD5=k._createHelper(p);j.HmacMD5=k._createHmacHelper(p)})(Math);


        var getavatar = function (emailaddress) {
         return   "http://www.gravatar.com/avatar/" + CryptoJS.MD5(emailaddress)
        }

        return getavatar;
    }]);


}());
(function () {
    MainMenu = function () {
        this._screen = null;
        this._last_screen = null;
        this._animate = false;
        this._close_timer = null;
        this._dropdown_li = null;
        this._dropdown = null;
        return this;
    };
    MainMenu.settings = {
        is_mobile: false,
        resize_delay: 400,
        stored_values_prefix: 'pa_',
            accordion: true,
            animation_speed: 250,
            store_state: true,
            store_state_key: 'mmstate',
            disable_animation_on: [],
            dropdown_close_delay: 300,
            detect_active: true,
            detect_active_predicate: function (href, url) {
                return href === url;
        },
        consts: {
            COLORS: ['#71c73e', '#77b7c5', '#d54848', '#6c42e5', '#e8e64e', '#dd56e6', '#ecad3f', '#618b9d', '#b68b68', '#36a766', '#3156be', '#00b3ff', '#646464', '#a946e8', '#9d9d9d']
        }
    };

    /*
     * Initialize plugin.
     */

    MainMenu.prototype.init = function () {
        var self, state;
        this.$menu = $('#main-menu');
        if (!this.$menu.length) {
            return;
        }
        this.$body = $('body');
        this.menu = this.$menu[0];
        this.$ssw_point = $('#small-screen-width-point');
        this.$tsw_point = $('#tablet-screen-width-point');
        self = this;
        if (MainMenu.settings.store_state) {
            document.body.className += ' disable-mm-animation';
            setTimeout((function (_this) {
                return function () {
                    return elRemoveClass(document.body, 'disable-mm-animation');
                };
            })(this), 20);
        }
        this.setupAnimation();
        //$(window).on('resize.pa.mm', $.proxy(this.onResize, this));
        this.onResize();
        this.$menu.find('.navigation > .mm-dropdown').addClass('mm-dropdown-root');
        if (MainMenu.settings.detect_active) {
            this.detectActiveItem();
        }
        if ($.support.transition) {
            this.$menu.on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', $.proxy(this._onAnimationEnd, this));
        }
        $('#main-menu-toggle').on('click', $.proxy(this.toggle, this));
        $('#main-menu-inner').slimScroll({
            height: '100%'
        }).on('slimscrolling', (function (_this) {
            return function () {
                return _this.closeCurrentDropdown(true);
            };
        })(this));
        this.$menu.on('click', '.mm-dropdown > a', function () {
            var li;
            li = this.parentNode;
            if (elHasClass(li, 'mm-dropdown-root') && self._collapsed()) {
                if (elHasClass(li, 'mmc-dropdown-open')) {
                    if (elHasClass(li, 'freeze')) {
                        self.closeCurrentDropdown(true);
                    } else {
                        self.freezeDropdown(li);
                    }
                } else {
                    self.openDropdown(li, true);
                }
            } else {
                self.toggleSubmenu(li);
            }
            return false;
        });
        this.$menu.find('.navigation').on('mouseenter.pa.mm-dropdown', '.mm-dropdown-root', function () {
            self.clearCloseTimer();
            if (self._dropdown_li === this) {
                return;
            }
            if (self._collapsed() && (!self._dropdown_li || !elHasClass(self._dropdown_li, 'freeze'))) {
                return self.openDropdown(this);
            }
        }).on('mouseleave.pa.mm-dropdown', '.mm-dropdown-root', function () {
            return self._close_timer = setTimeout(function () {
                return self.closeCurrentDropdown();
            }, MainMenu.settings.dropdown_close_delay);
        });
        return this;
    };

    MainMenu.prototype._collapsed = function () {
        return (this._screen === 'desktop' && elHasClass(document.body, 'mmc')) || (this._screen !== 'desktop' && !elHasClass(document.body, 'mme'));
    };

    MainMenu.prototype.onResize = function () {
        this._screen = getScreenSize(this.$ssw_point, this.$tsw_point);
        this._animate = MainMenu.settings.disable_animation_on.indexOf(screen) === -1;
        if (this._dropdown_li) {
            this.closeCurrentDropdown(true);
        }
        //if ((this._screen === 'small' && this._last_screen !== this._screen) || (this._screen === 'tablet' && this._last_screen === 'small')) {
        //    document.body.className += ' disable-mm-animation';
        //    setTimeout((function (_this) {
        //        return function () {
        //            return elRemoveClass(document.body, 'disable-mm-animation');
        //        };
        //    })(this), 20);
        //}
        return this._last_screen = this._screen;
    };

    MainMenu.prototype.clearCloseTimer = function () {
        if (this._close_timer) {
            clearTimeout(this._close_timer);
            return this._close_timer = null;
        }
    };

    MainMenu.prototype._onAnimationEnd = function (e) {
        if (this._screen !== 'desktop' || e.target.id !== 'main-menu') {
            return;
        }
        return $(window).trigger('resize');
    };

    MainMenu.prototype.toggle = function () {
        var cls, collapse;
        this._screen = getScreenSize(this.$ssw_point, this.$tsw_point);
        cls = this._screen === 'small' || this._screen === 'tablet' ? 'mme' : 'mmc';
        if (elHasClass(document.body, cls)) {
            elRemoveClass(document.body, cls);
        } else {
            document.body.className += ' ' + cls;
        }
        if (cls === 'mmc') {
            if (!$.support.transition) {
                return $(window).trigger('resize');
            }
        } else {
            collapse = document.getElementById('');
            $('#main-navbar-collapse').stop().removeClass('in collapsing').addClass('collapse')[0].style.height = '0px';
            return $('#main-navbar .navbar-toggle').addClass('collapsed');
        }
    };

    MainMenu.prototype.collapse = function () {
        var cls, collapse;
        cls = this._screen === 'small' || this._screen === 'tablet' ? 'mme' : 'mmc';
        if (!elHasClass(document.body, cls)) {
            document.body.className += ' ' + cls;
        }
        if (cls === 'mmc') {
            if (!$.support.transition) {
                return $(window).trigger('resize');
            }
        } 
    }


    MainMenu.prototype.hide = function () {
        if (!elHasClass(document.body, "hmm")) {
            document.body.className += ' ' + "hmm";
        }
    }

    MainMenu.prototype.show = function () {
        if (elHasClass(document.body, "hmm")) {
            elRemoveClass(document.body, "hmm");
        }
    }

    MainMenu.prototype.notfixed = function () {
        if (elHasClass(document.body, "main-menu-fixed")) {
            elRemoveClass(document.body, "main-menu-fixed");
        }
    }

    MainMenu.prototype.fixed = function () {
        if (!elHasClass(document.body, "main-menu-fixed")) {
            document.body.className += ' ' + "main-menu-fixed";
        }
    }


    MainMenu.prototype.expand = function () {
        var cls, collapse;
        cls = this._screen === 'small' || this._screen === 'tablet' ? 'mme' : 'mmc';
        if (elHasClass(document.body, cls)) {
            elRemoveClass(document.body, cls);
        }
        if (!cls === 'mmc') {
            collapse = document.getElementById('');
            $('#main-navbar-collapse').stop().removeClass('in collapsing').addClass('collapse')[0].style.height = '0px';
            return $('#main-navbar .navbar-toggle').addClass('collapsed');
        }
    };

    MainMenu.prototype.toggleSubmenu = function (li) {
        this[elHasClass(li, 'open') ? 'collapseSubmenu' : 'expandSubmenu'](li);
        return false;
    };

    MainMenu.prototype.collapseSubmenu = function (li) {
        var $li, $ul;
        $li = $(li);
        $ul = $li.find('> ul');
        if (this._animate) {
            $ul.animate({
                height: 0
            }, MainMenu.settings.animation_speed, (function (_this) {
                return function () {
                    elRemoveClass(li, 'open');
                    $ul.attr('style', '');
                    return $li.find('.mm-dropdown.open').removeClass('open').find('> ul').attr('style', '');
                };
            })(this));
        } else {
            elRemoveClass(li, 'open');
        }
        return false;
    };

    MainMenu.prototype.expandSubmenu = function (li) {
        var $li, $ul, h, ul;
        $li = $(li);
        if (MainMenu.settings.accordion) {
            this.collapseAllSubmenus(li);
        }
        if (this._animate) {
            $ul = $li.find('> ul');
            ul = $ul[0];
            ul.className += ' get-height';
            h = $ul.height();
            elRemoveClass(ul, 'get-height');
            ul.style.display = 'block';
            ul.style.height = '0px';
            li.className += ' open';
            return $ul.animate({
                height: h
            }, MainMenu.settings.animation_speed, (function (_this) {
                return function () {
                    return $ul.attr('style', '');
                };
            })(this));
        } else {
            return li.className += ' open';
        }
    };

    MainMenu.prototype.collapseAllSubmenus = function (li) {
        var self;
        self = this;
        return $(li).parent().find('> .mm-dropdown.open').each(function () {
            return self.collapseSubmenu(this);
        });
    };

    MainMenu.prototype.openDropdown = function (li, freeze) {
        var $li, $title, $ul, $wrapper, max_height, min_height, title_h, top, ul, w_height, wrapper;
        if (freeze == null) {
            freeze = false;
        }
        if (this._dropdown_li) {
            this.closeCurrentDropdown(freeze);
        }
        $li = $(li);
        $ul = $li.find('> ul');
        ul = $ul[0];
        this._dropdown_li = li;
        this._dropdown = ul;
        $title = $ul.find('> .mmc-title');
        if (!$title.length) {
            $title = $('<div class="mmc-title"></div>').text($li.find('> a > .mm-text').text());
            ul.insertBefore($title[0], ul.firstChild);
        }
        li.className += ' mmc-dropdown-open';
        ul.className += ' mmc-dropdown-open-ul';
        top = $li.position().top;
        if (elHasClass(document.body, 'main-menu-fixed')) {
            $wrapper = $ul.find('.mmc-wrapper');
            if (!$wrapper.length) {
                wrapper = document.createElement('div');
                wrapper.className = 'mmc-wrapper';
                wrapper.style.overflow = 'hidden';
                wrapper.style.position = 'relative';
                $wrapper = $(wrapper);
                $wrapper.append($ul.find('> li'));
                ul.appendChild(wrapper);
            }
            w_height = $(window).innerHeight();
            title_h = $title.outerHeight();
            min_height = title_h + $ul.find('.mmc-wrapper > li').first().outerHeight() * 3;
            if ((top + min_height) > w_height) {
                max_height = top - $('#main-navbar').outerHeight();
                ul.className += ' top';
                ul.style.bottom = (w_height - top - title_h) + 'px';
            } else {
                max_height = w_height - top - title_h;
                ul.style.top = top + 'px';
            }
            if (elHasClass(ul, 'top')) {
                ul.appendChild($title[0]);
            } else {
                ul.insertBefore($title[0], ul.firstChild);
            }
            li.className += ' slimscroll-attached';
            $wrapper[0].style.maxHeight = (max_height - 10) + 'px';
            //$wrapper.pixelSlimScroll({});
        } else {
            ul.style.top = top + 'px';
        }
        if (freeze) {
            this.freezeDropdown(li);
        }
        if (!freeze) {
            $ul.on('mouseenter', (function (_this) {
                return function () {
                    return _this.clearCloseTimer();
                };
            })(this)).on('mouseleave', (function (_this) {
                return function () {
                    return _this._close_timer = setTimeout(function () {
                        return _this.closeCurrentDropdown();
                    },MainMenu.settings.dropdown_close_delay);
                };
            })(this));
            this;
        }
        return this.menu.appendChild(ul);
    };

    MainMenu.prototype.closeCurrentDropdown = function (force) {
        var $dropdown, $wrapper;
        if (force == null) {
            force = false;
        }
        if (!this._dropdown_li || (elHasClass(this._dropdown_li, 'freeze') && !force)) {
            return;
        }
        this.clearCloseTimer();
        $dropdown = $(this._dropdown);
        if (elHasClass(this._dropdown_li, 'slimscroll-attached')) {
            elRemoveClass(this._dropdown_li, 'slimscroll-attached');
            $wrapper = $dropdown.find('.mmc-wrapper');
            //$wrapper.pixelSlimScroll({
            //    destroy: 'destroy'
            //}).find('> *').appendTo($dropdown);
            $wrapper.find('> *').appendTo($dropdown);
            $wrapper.remove();
        }
        this._dropdown_li.appendChild(this._dropdown);
        elRemoveClass(this._dropdown, 'mmc-dropdown-open-ul');
        elRemoveClass(this._dropdown, 'top');
        elRemoveClass(this._dropdown_li, 'mmc-dropdown-open');
        elRemoveClass(this._dropdown_li, 'freeze');
        $(this._dropdown_li).attr('style', '');
        $dropdown.attr('style', '').off('mouseenter').off('mouseleave');
        this._dropdown = null;
        return this._dropdown_li = null;
    };

    MainMenu.prototype.freezeDropdown = function (li) {
        return li.className += ' freeze';
    };

    MainMenu.prototype.setupAnimation = function () {
        var $mm, $mmNav, dBody, dsblAnimationOn;
        dBody = document.body;
        dsblAnimationOn = MainMenu.settings.disable_animation_on;
        dBody.className += ' dont-animate-mm-content';
        $mm = $('#main-menu');
        $mmNav = $mm.find('.navigation');
        $mmNav.find('> .mm-dropdown > ul').addClass('mmc-dropdown-delay animated');
        $mmNav.find('> li > a > .mm-text').addClass('mmc-dropdown-delay animated fadeIn');
        $mm.find('.menu-content').addClass('animated fadeIn');
        if (elHasClass(dBody, 'main-menu-right') || (elHasClass(dBody, 'right-to-left') && !elHasClass(dBody, 'main-menu-right'))) {
            $mmNav.find('> .mm-dropdown > ul').addClass('fadeInRight');
        } else {
            $mmNav.find('> .mm-dropdown > ul').addClass('fadeInLeft');
        }
        dBody.className += dsblAnimationOn.indexOf('small') === -1 ? ' animate-mm-sm' : ' dont-animate-mm-content-sm';
        dBody.className += dsblAnimationOn.indexOf('tablet') === -1 ? ' animate-mm-md' : ' dont-animate-mm-content-md';
        dBody.className += dsblAnimationOn.indexOf('desktop') === -1 ? ' animate-mm-lg' : ' dont-animate-mm-content-lg';
        return window.setTimeout(function () {
            return elRemoveClass(dBody, 'dont-animate-mm-content');
        }, 500);
    };

    MainMenu.prototype.detectActiveItem = function () {
        var a, bubble, links, nav, predicate, url, _i, _len, _results;
        url = (document.location + '').replace(/\#.*?$/, '');
        predicate = MainMenu.settings.detect_active_predicate;
        nav = $('#main-menu .navigation');
        nav.find('li').removeClass('open active');
        links = nav[0].getElementsByTagName('a');
        bubble = (function (_this) {
            return function (li) {
                li.className += ' active';
                if (!elHasClass(li.parentNode, 'navigation')) {
                    li = li.parentNode.parentNode;
                    li.className += ' open';
                    return bubble(li);
                }
            };
        })(this);
        _results = [];
        for (_i = 0, _len = links.length; _i < _len; _i++) {
            a = links[_i];
            if (a.href.indexOf('#') === -1 && predicate(a.href, url)) {
                bubble(a.parentNode);
                break;
            } else {
                _results.push(void 0);
            }
        }
        return _results;
    };

    window.getScreenSize = function () {
        var width = $(document).width();
        if (width < 470) {
            return 'small';
        } else if (width < 771) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    };

    window.elHasClass = function (el, selector) {
        return (" " + el.className + " ").indexOf(" " + selector + " ") > -1;
    };

    window.elRemoveClass = function (el, selector) {
        return el.className = (" " + el.className + " ").replace(" " + selector + " ", ' ').trim();
    };

    


    
    angular.module('component').factory('mainMenuService', [function () {

        var menu = new MainMenu();

        var init = function () {
            menu.init();
        }

        var toggle = function () {
            menu.toggle();
        }

        var collapse = function () {
            menu.collapse();
        }


        var expand=function(){
            menu.expand();
        }

        var hide=function() {
            menu.hide();
        }

        var show = function () {
            menu.show();
        }
        var notfixed= function() {
            menu.notfixed();
        }

        var fixed = function () {
            menu.fixed();
        }

        return {
            init: init,
            toggle: toggle,
            collapse: collapse,
            expand: expand,
            hide:hide,
            show: show,
            notfixed: notfixed,
            fixed: fixed,
        };

    }]);
})();

    angular.module('component').constant('notificationDefaults', {
        "closeButton": false,
        "debug": false,
        "positionClass": "toast-top-right",
        "onclick": null,
        "showDuration": "3000",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }).factory('notificationService', ["notificationDefaults", function (notificationDefaults) {
        var success = function (title,message,options) {
            if (!title) { title = "Success"; }
            if (!message) { message = ""; }
            toastr.success("<h3 style='margin-top:0'>" + title + "</h3>" + message)
            options = $.extend({}, notificationDefaults, options || {});
            toastr.options = options;
        };
        var info = function (title, message, options) {
            if (!title) { title = "Info"; }
            if (!message) { message = ""; }
            toastr.info("<h3 style='margin-top:0'>" + title + "</h3>" + message)
            options = $.extend({}, notificationDefaults, options || {});
            toastr.options = options;
        };
        var warning = function (title,message,options) {
            if (!title) { title = "Warning"; }
            if (!message) { message = ""; }
            toastr.warning("<h3 style='margin-top:0'>" + title + "</h3>" + message)
            options = $.extend({}, notificationDefaults, options || {});
            toastr.options = options;
        };
        var error = function (title, message, options) {
            if (!title) { title = "Error"; }
            if (!message) { message = ""; }
            toastr.error("<h3 style='margin-top:0'>" + title + "</h3>" + message)
            options = $.extend({}, notificationDefaults, options || {});
            toastr.options = options;
        };

        return {
            success: success,
            info: info,
            warning: warning,
            error: error,
        }
    }])

//progressBar.show("Data Loading");
    //---Required NProgress---//
    angular.module('directives').factory('progressBar', function () {
        var show = function (message) {
            if (NProgress && NProgress.start) {
                NProgress.start();
            }
        };
        var hide = function (message) {
            if (NProgress && NProgress.start) {
                NProgress.done();
            }
        };

        var hideWithError = function (message) {
            if (NProgress && NProgress.start) {
                NProgress.done();
            }
        };

        return {
            show: show,
            hide: hide,
            hideWithError: hideWithError,
        };

    });
(function () {
    angular.module('component').factory('themeSelectorService', function () {
        var change = function (themename) {
            if (themename == "theme-adminflare" || value == "theme-asphalt" || value == "theme-clean" || value == "theme-default" || value == "theme-dust"
                || value == "theme-fresh" || value == "theme-frost" || value == "theme-purple-hills" || value == "theme-silver" || value == "theme-white") {
                var body = angular.element(document).find('body');
                $(body).removeClass("theme-adminflare theme-asphalt theme-clean theme-default theme-dust theme-fresh theme-frost theme-purple-hills theme-silver theme-white");
                $(body).addClass(themename);
            }
        };
       

        return {
            adminflare: change("theme-adminflare"),
            asphalt: change("theme-asphalt"),
            clean: change("theme-clean"),
            default: change("theme-default"),
            dust: change("theme-dust"),
            fresh: change("theme-fresh"),
            frost: change("theme-frost"),
            purplehills: change("theme-purple-hills"),
            silver: change("theme-silver"),
            white: change("theme-white"),
        };

    });
})();
//(function () {
//    angular.module('data').factory("dataContext", ["$http", "progressBar", "dxTest", "dxProduct", "dxProductCategory", "dxProductSubcategory", "dxUnitMeasure", "dxProductModel", function ($http, progressBar, dxTest, dxProduct, dxProductCategory, dxProductSubcategory, dxUnitMeasure, dxProductModel) {
//        dxTest: dxTest;
//        dxProduct: dxProduct;
//        dxProductCategory: dxProductCategory;
//        dxProductSubcategory: dxProductSubcategory;
//        dxUnitMeasure: dxUnitMeasure;
//        dxProductModel: dxProductModel;
//        return {
//            dxTest: dxTest,
//            Products: dxProduct,
//            ProductCategories: dxProductCategory,
//            ProductSubcategories: dxProductSubcategory,
//            UnitMeasures: dxUnitMeasure,
//            ProductModels:dxProductModel,
//        };
//    }]);
//})();
angular.module("data").factory("storage", [function () {

    var storage = function (uniqueid) {
        var self = this;
        self.storagePrefix = "AWStettings.";
        self.result = {};

        self.getitems = function() {
            if (localStorage.getItem(self.storagePrefix + uniqueid)) {
                var result = localStorage.getItem(self.storagePrefix + uniqueid);
                self.result = JSON.parse(result);
                return self.result;
            }
        };

        self.setItem = function(domain, value) {
            if (value) {
                if (this.result[domain] != value) {
                    this.result[domain] = value;
                    localStorage.setItem(self.storagePrefix + uniqueid, JSON.stringify(this.result));
                }
            }
        };
        self.setrootItem = function(value) {
            if (value) {

                this.result = value;
                localStorage.setItem(self.storagePrefix + uniqueid, JSON.stringify(this.result));

            }
        };

        self.resetFilter = function () {
            if (self.result && self.result.filter) {
                self.result.filter = null;
                self.setrootItem(this.result)
                getitems();
            }
           
        };


        self.resetAll = function () {
            self.result = {};
            self.setrootItem(self.result);
                getitems();
            

        };

        self.Addcolumns = function (column) {
            if (!self.result.listcolumns) {
                self.result.listcolumns = [];
            }
            self.result.listcolumns.push(column);
            self.setrootItem(self.result)
            self.getitems();
        };

        self.Removecolumns = function (column) {
            if (!self.result.listcolumns) {
                self.result.listcolumns = [];
            }

            var index = self.result.listcolumns.indexOf(column);
                if (index!=null) if (index > -1) {
                    self.result.listcolumns.splice(index, 1);
                }
                self.setrootItem(self.result)
                self.getitems();
        };
        self.Columnssorted = function (listcolumns) {
            if (!self.result.listcolumns) {
                self.result.listcolumns = [];
            }

            self.result.listcolumns = listcolumns;
            self.setrootItem(self.result)
            self.getitems();
        };
        return self;
    }
    return storage;

}]);


//<div localstorage value="viewMode" uniqueid="'ProductsviewMode'"></div>
(function () {
    //---Required localStorage---//
    angular.module('directives').directive('mmLocalstorage', ["storage", function (storage) {
        return {

            scope: {
                value: "="
            },
            //require: '?ngModel',
            link: function (scope, element, attributes, ngModelCtrl) {
                if (attributes.uniqueid) {
                    var str = new storage(attributes.uniqueid);
                    str.getitems();
                    var res;
                    if (attributes.domain != null) {
                        scope.value = str.result[attributes.domain];
                    } else {
                        scope.value = str.result;
                    }

                    scope.$watchCollection("value", function (newVal, oldVal) {

                        if (newVal && newVal != oldVal) {
                            if (attributes.domain) {
                                str.setItem(attributes.domain, newVal)
                            } else {
                                str.setrootItem(scope.value)
                            }
                        }
                    });
                    scope.$watchCollection("value.filter", function (newVal, oldVal) {
                        if (newVal && newVal != oldVal) {
                            str.setrootItem(scope.value);
                            //localStorage.setItem(scope.uniqueid, JSON.stringify(scope.value));
                        }
                    });
                };



            }
        };
    }]);
})();
//(function () {
//    angular.module('data').factory("dxProduct", ["entitySet", "$http",function (entitySet,$http) {
//        var items = {};
//        var dataservice = new entitySet("/Productsjson.txt", "ProductID", null);
//        var refresh = function () { return dataservice.getData(items); };
//        var getByid = function (id) { return dataservice.getByid(id, items); };
//        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
//        var add = function (item) { return dataservice.insertDataAddLocal(item); };
//        var update = function (item) { return dataservice.updateData(item); };
//        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
//        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
//        var addlocal = function (item) { return dataservice.addlocal(item); };

//        return {
//            items: items,
//            refresh: refresh,
//            getLocalById: getLocalById,
//            add: add,
//            update: update,
//            remove: remove,
//            addorUpdate: addorUpdate,
//            getByid: getByid,
//            addlocal: addlocal,
//        };
//    }]);
//})();
(function () {
    angular.module('data').factory("dxTest", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/Productsjson.txt", "ProductID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("entitySet", ["$http", "progressBar", function ($http, progressBar) {

        var mapMemoToArray = function (items) {
            var underlyingArray = [];
            for (var prop in items) {
                if (items.hasOwnProperty(prop)) {
                    underlyingArray.push(items[prop]);
                }
            }
            return underlyingArray;
        };
        var itemsToArray = function (items, observableArray) {
            if (!observableArray) return null;
            var underlyingArray = mapMemoToArray(items);
            //observableArray.value = underlyingArray;
            observableArray.value = [];
            angular.copy(underlyingArray, observableArray.value);
            return observableArray;
        };
        var mapToContext = function (dtoList, items, results, mapper, idField) {
            items = _.reduce(dtoList, function (memo, dto) {
                var id;
                if (idField) {
                    id = dto[idField];
                } else {
                    id = dto.ID;
                }
                var existingItem = items[id];
                if (mapper) {
                    existingItem = existingItem || new mapper(dto);
                } else {
                    existingItem = existingItem || dto;
                }
                memo[id] = existingItem;
                return memo;
            }, {});
            //results = itemsToArray(items, results);
            //logger.info('received with ' + dtoList.length + ' elements');
            itemsToArray(items, results);
            return items; // must return these
        };
        var entitySet = function (baseurl, idField, mapper) {
            var items = {},
                observableArray = {},
                getData = function (results, force) {
                    return $.Deferred(function (def) {
                        observableArray = results;
                        if (!baseurl) {
                            progressBar.hideWithError("Url Missing");
                            def.reject();
                            return;
                        }
                        if (results.value != null && !!!force) {
                            def.resolve(results.value);
                        } else {
                            progressBar.show("Data Loading");
                            $http.get(baseurl, { cache: true }).then(
                                function (result) {
                                    items = mapToContext(result.data, items, results, mapper, idField);
                                    progressBar.hide("Data Loaded");
                                    //  results.value = itemsToArray(items, results.value);
                                    def.resolve(results.value);
                                },
                                function (error) {
                                    progressBar.hideWithError(error);
                                    def.reject();
                                }
                            );
                        }
                    }).promise();
                },
                getByid = function (id, results) {
                    return $.Deferred(function (def) {
                        progressBar.show("Data Loading");
                        observableArray = results;
                        if (!baseurl) {
                            progressBar.hideWithError("Url Missing");
                            def.reject();
                            return;
                        }

                        $http.get(baseurl + '/' + id).then(
                            function (result) {
                                items[id] = result.data;
                                itemsToArray(items, results);
                                progressBar.hide("Data Loaded");
                                def.resolve(result.data);
                            },
                            function (error) {
                                progressBar.hideWithError(error);
                                def.reject();
                            }
                        );


                    }).promise();
                },
                getCustomData = function (customUrl, results) {
                    return $.Deferred(function (def) {
                        progressBar.show("Data Loading");
                        observableArray = results;
                        if (!customUrl) {
                            progressBar.hideWithError("Get Function is Missing");
                            def.reject();
                            return;
                        }
                        $http.get(customUrl, { cache: true }).then(
                              function (result) {
                                  items = mapToContext(result.data, items, results, mapper, idField);
                                  progressBar.hide("Data Loaded");
                                  def.resolve(result.data);
                              },
                           function (error) {
                               progressBar.hideWithError(error);
                               def.reject();
                           });
                    }).promise();
                },
                 getHttp = function (customUrl) {
                     return $.Deferred(function (def) {
                         progressBar.show("Data Loading");
                         if (!customUrl) {
                             progressBar.hideWithError("Get Function is Missing");
                             def.reject();
                             return;
                         }
                         $http.get(customUrl, { cache: true }).then(
                               function (result) {
                                  // items = mapToContext(result.data, items, results, mapper, idField);
                                   progressBar.hide("Data Loaded");
                                   def.resolve(result.data);
                               },
                            function (error) {
                                progressBar.hideWithError(error);
                                def.reject();
                            });
                     }).promise();
                 },

                insertData = function (item) {
                    return $.Deferred(function (def) {
                        progressBar.show("Data Inserting");
                        if (item == null) return;
                        //var itemjson = item.ToJSON();
                        if (!baseurl) {
                            progressBar.hideWithError('insert function not implemented');
                            def.reject();
                            return;
                        }
                        $http.post(baseurl, item).then(
                            function (result) {
                                progressBar.hide("Data Loaded");
                                def.resolve(result.data);
                            },
                            function (error) {
                                progressBar.hideWithError(error);
                                def.reject(error);
                            }
                        );

                    }).promise();
                },
                insertDataAddLocal = function (item) {
                    return insertData(item).then(function (result) {
                        if (result && result[idField]) {
                            //var id = result.data[idField];
                            //items[id] = result.data;
                            item[idField] = result[idField];
                            addlocal(result);
                        }
                    });
                },
                updateData = function (item) {
                    return $.Deferred(function (def) {
                        progressBar.show("Data updating");
                        if (item == null) return;
                        //var itemjson = item.ToJSON();
                        if (!baseurl) {
                            progressBar.hideWithError('Update function not implemented');
                            def.reject();
                            return;
                        }
                        $http.put(baseurl, item).then(
                            function (result) {
                                progressBar.hide("Data Loaded");
                                var returnResult = "";
                                if (result.data && result.data[idField] && items[result.data[idField]]) {
                                    var id = result.data[idField];
                                    items[id] = result.data;
                                    returnResult = result.data;
                                } else {
                                    var id = item[idField];
                                    items[id] = item;
                                    returnResult = item;
                                }
                                itemsToArray(items, observableArray);

                                def.resolve(returnResult);
                            },
                            function (error) {
                                progressBar.hideWithError(error);
                                def.reject(error);
                            }
                        );
                    }).promise();
                },
                insertorUpdateData = function (item) {
                    return item[idField] ? updateData(item) : insertDataAddLocal(item);
                },
                deleteData = function (id) {
                    return $.Deferred(function (def) {
                        progressBar.show("Data deleting");
                        if (item == null) return;
                        //var itemjson = item.ToJSON();
                        if (!baseurl) {
                            progressBar.hideWithError('delete function not implemented');
                            def.reject();
                            return;
                        }
                        $http.delete(baseurl + '?id=' + id).then(
                            function (result) {
                                progressBar.hide("Data Loaded");
                                //if (result.data && result.data[idField] && items[result.data[idField]]) {
                                //    var id = result.data[idField];
                                //    items[id] = result.data;
                                //}
                                //itemsToArray(items, observableArray);
                                def.resolve(result.data);
                            },
                            function (error) {
                                progressBar.hideWithError(error);
                                def.reject(error);
                            }
                        );
                    }).promise();
                },
                deleteDataRemovelocal = function (item) {
                    return $.Deferred(function (def) {
                        if (item && item[idField]) {
                            deleteData(item[idField]).then(function (result) {
                                removelocalById(result[idField]);
                                def.resolve(result);
                            }, function (error) {
                                def.reject(error);
                            });
                        } else {
                            def.reject("Item or ID undefined");
                        }
                    }).promise();
                },
                getAllLocal = function () {
                    return mapMemoToArray(items);
                },
                getLocalbyId = function (id) {
                    return !!id && !!items[id] ? items[id] : null;
                },
                addlocal = function (item) {
                    if (idField) {
                        items[item[idField]] = item;
                    } else {
                        items[item.ID] = item;
                    }
                    itemsToArray(items, observableArray);
                },
                removelocalById = function (id) {
                    delete items[id];
                    itemsToArray(items, observableArray);
                };

            return {
                getData: getData,
                getByid: getByid,
                getCustomData: getCustomData,
                getHttp:getHttp,
                insertData: insertData,
                updateData: updateData,
                deleteData: deleteData,
                getAllLocal: getAllLocal,
                getLocalbyId: getLocalbyId,
                addlocal: addlocal,
                removelocalById: removelocalById,
                insertDataAddLocal: insertDataAddLocal,
                deleteDataRemovelocal: deleteDataRemovelocal,
                insertorUpdateData: insertorUpdateData,
            };
        };
        return entitySet;
    }]);
})();
angular.module("data").factory('rottentService',[
    "$http", "$q", "$rootScope", function ($http, $q, $rootScope) {

        var getcontent= function(address) {
            var deferred = $q.defer();
            $.ajax({
                type: 'GET',
                dataType: "jsonp",
                url: address,
                success: function (responseData, textStatus, jqXHR) {
                    moviesBoxOffice = responseData;
                    //.movies
                    $rootScope.$apply(function () {
                        moviesBoxOffice = responseData;
                    });
                    deferred.resolve(responseData);
                },
                error: function (responseData, textStatus, errorThrown) {
                    deferred.reject(new Error(errorThrown));
                    console.log("something went wrong!! Error: " + textStatus);
                }
            });
            return deferred.promise;
        }

        var moviesBoxOffice = {};
        var moviesBoxOfficeCall = function() {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/box_office.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }
        var moviesInTheatersCall = function () {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }
        var moviesOpeningCall = function () {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/opening.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }
        var moviesUpcomingCall = function () {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/upcoming.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }


        var dvdsTopRentalsCall = function () {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/dvds/top_rentals.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }

        var dvdsCurrentReleasesCall = function () {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/dvds/current_releases.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }
        var dvdsNewReleasesCall = function () {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/dvds/new_releases.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }
        var dvdsUpcomingCall = function () {
            var address = "http://api.rottentomatoes.com/api/public/v1.0/lists/dvds/upcoming.json?apikey=75svr8r6hpjhsfu63pk8erkf";
            return getcontent(address);
        }

    var searchCall = function (term,resultsperpage,pagenumber) {
            if (!resultsperpage) { resultsperpage = 50; }
            if (!pagenumber) { pagenumber = 1; }
            var address = "http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=75svr8r6hpjhsfu63pk8erkf&q=" + term + "&page_limit=" + resultsperpage + "&page=" + pagenumber;
            return getcontent(address);
        }


        return{
            moviesBoxOffice: moviesBoxOffice,
            moviesBoxOfficeCall:moviesBoxOfficeCall,
            moviesInTheatersCall: moviesInTheatersCall,
            moviesOpeningCall: moviesOpeningCall,
            moviesUpcomingCall: moviesUpcomingCall,

            dvdsTopRentalsCall: dvdsTopRentalsCall,
            dvdsCurrentReleasesCall: dvdsCurrentReleasesCall,
            dvdsNewReleasesCall: dvdsNewReleasesCall,
            dvdsUpcomingCall: dvdsUpcomingCall,
            searchCall: searchCall,
        }
  }]);
(function () {
    angular.module('data').factory("dxBillOfMaterials", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/BillOfMaterialJson", "BillOfMaterialsID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxCulture", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/CultureJson", "CultureID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxDocument", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/", "DocumentNode", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxIllustration", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/IllustrationJson", "IllustrationID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxLocation", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/LocationJson", "LocationID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
//(function () {
//    angular.module('data').factory("dxProduct", ["entitySet", function (entitySet) {
//        var items = {};
//        var dataservice = new entitySet("/api/Product", "ProductID", null);
//        var refresh = function () { return dataservice.getData(items); };
//        var costPriceHostory = function (id) { return dataservice.getCustomData("/api/Product/" + id + "/pricecosthistory") }

//        var getByid = function (id) { return dataservice.getByid(id, items); };
//        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
//        var add = function (item) { return dataservice.insertDataAddLocal(item); };
//        var update = function (item) { return dataservice.updateData(item); };
//        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
//        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
//        var addlocal = function (item) { return dataservice.addlocal(item); };

//        var getCosthistory = function (id) { return dataservice.getHttp("/api/ProductJson/" + id + "/CostHistory"); };
//        var getPriceHistory = function (id) { return dataservice.getHttp("/api/ProductJson/" + id + "/PriceHistory"); };
//        var getTransactions = function (id) { return dataservice.getHttp("api/ProductJson/"+id+"/transactions"); };
//        var getProductAssembly = function (id) { return dataservice.getHttp("api/ProductJson/" + id + "/ProductAssembly"); };



//        return {
//            items: items,
//            refresh: refresh,
//            getLocalById: getLocalById,
//            add: add,
//            update: update,
//            remove: remove,
//            addorUpdate: addorUpdate,
//            getByid: getByid,
//            addlocal: addlocal,
//            getPriceHistory: getPriceHistory,
//            getCosthistory: getCosthistory,
//            getTransactions: getTransactions,
//            getProductAssembly: getProductAssembly,
//            costPriceHostory: costPriceHostory,
//        };
//    }]);
//})();
(function () {
    angular.module('data').factory("dxProductCategory", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductCategory", "ProductCategoryID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxProductDescription", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductDescriptionJson", "ProductDescriptionID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxProductDocument", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductDocumentJson", "ProductID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxProductInventory", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductInventoryJson", "rowguid", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxProductModel", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductModel", "ProductModelID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxProductPhoto", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductPhotoJson", "ProductPhotoID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxProductReview", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductReviewJson", "ProductReviewID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxProductSubcategory", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/ProductSubcategory", "ProductSubcategoryID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxScrapReason", ["entitySet", function (entitySet) {
        

        var items = {};
        var dataservice = new entitySet("/api/ScrapReasonJson", "ScrapReasonID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxTransactionHistory", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/TransactionHistoryJson", "TransactionID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxUnitMeasure", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/UnitMeasure", "UnitMeasureCode", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxWorkOrder", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/WorkOrderJson", "WorkOrderID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
(function () {
    angular.module('data').factory("dxWorkOrderRouting", ["entitySet", function (entitySet) {
        var items = {};
        var dataservice = new entitySet("/api/", "WorkOrderID", null);
        var refresh = function () { return dataservice.getData(items); };
        var getByid = function (id) { return dataservice.getByid(id, items); };
        var getLocalById = function (id) { return dataservice.getLocalbyId(id); };
        var add = function (item) { return dataservice.insertDataAddLocal(item); };
        var update = function (item) { return dataservice.updateData(item); };
        var addorUpdate = function (item) { return dataservice.insertorUpdateData(item); };
        var remove = function (item) { return dataservice.deleteDataRemovelocal(item); };
        var addlocal = function (item) { return dataservice.addlocal(item); };

        return {
            items: items,
            refresh: refresh,
            getLocalById: getLocalById,
            add: add,
            update: update,
            remove: remove,
            addorUpdate: addorUpdate,
            getByid: getByid,
            addlocal: addlocal,
        };
    }]);
})();
angular.module("component").filter('bytes', function () {
    return function (bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    }
});
(function () {
    angular.module('data').filter('gravatarfilter', ["gravatarService", function (gravatarService) {
        return function (input) {
            var result = gravatarService(input);
            var content = result;
            return result;
        }
    }]);
})();
(function () {
    angular.module('component').filter('momentfromnow', function () {
    return function (input) {

       var result = moment(input).fromNow();
       return result;
        //return input ;
    }});
})();
(function () {
    angular.module('component').filter('noparents', function () {
    return function (input) {

        var result = _.filter(input, function (item) {
            if (item && !item.ParentID ) {
                return true;
            }
        });
        return result;
        //return input ;
    }
});


angular.module('component').filter('children', function () {
    return function (input, array) {

        var result = _.filter(array, function (item) {
            if (item.ParentID  == input.ID) {
                return true;
            }
        });
        return result;
        //return input ;
    }
});
})();

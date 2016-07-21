function d3network(config) {

// get the data
//d3.csv("force.csv", function(error, links) {


    var nodes = {};
    var links = config.links;
    var enableDirection = config.enableDirection;

    var maxStrWidth, minStrWidth, strWidth = [], adjStrWidth = [];

    // Compute the distinct nodes from the links.
    links.forEach(function (link) {
        link.source = nodes[link.source] ||
                (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] ||
                (nodes[link.target] = {name: link.target});
        
        if (typeof(link.targetClick) === "function") {
            nodes[link.target.name].nodeClick = link.targetClick;
        }
        if (typeof(link.sourceClick) === "function") {
            nodes[link.source.name].nodeClick = link.sourceClick;
        }
        
        // ----------------------------------------------
        
        var value = config.strokeWidthMin;
        if (typeof(link.value) === "number") {
            value = link.value;
        }
        // 計算最大與最小線條寬度
        if (maxStrWidth === undefined) {
            maxStrWidth = value;
            minStrWidth = value;
        }
        else {
            if (value > maxStrWidth) {
                maxStrWidth = value;
            }
            if (value < minStrWidth) {
                minStrWidth = value;
            }
        }
        strWidth.push(value);
        
        link.value = +link.value;
    });
    
    // -------------------------------------
    var oriInterval = maxStrWidth - minStrWidth;
//    console.log(oriInterval);
    if (oriInterval > 0) {
        // 標準化
        var configMax = config.strokeWidthMax;
        var configMin = config.strokeWidthMin;
        var configInterval = configMax - configMin;
        for (var _i = 0; _i < strWidth.length; _i++) {
            var _s = strWidth[_i];
//            var _interval = _s - minStrWidth;
//            console.log(_s);
            _s = _s - minStrWidth;
            _s = _s / oriInterval;
            _s = _s * configInterval;
            _s = _s + configMin;
//            console.log(["final", _s]);
            adjStrWidth[_i] = _s;
        }
        
        /*
        [1 - 3] < [2-4] min:2 max:4
        2 > 1
        4 > 3
        
        max - min = oriInterval
        configMax - configMin = configInterval
        
        oriInterval / configInterval
        */
        //console.log(adjStrWidth);
    }
    // -------------------------------------

    var width = config.canvasWidth,
            height = config.canvasHeight;

    var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([width, height])
            .linkDistance(config.linkDistance)
            .charge(-300)
            .on("tick", tick)
            .start();

    var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

    if (enableDirection === true) {
        var calMarkerSize = function (width) {
//            width = Math.sqrt(width) + config.arrowSizeMin;
////            //width = width / 3;
//            console.log([width, config.arrowMaxSize]);
            if (width < config.arrowMaxSize) {
                //console.log(["設定", width]);
                width = config.arrowDefaultSize;
            }
            else {
                width = width * config.arrowDefaultSize;
            }
////            console.log([width]);
////            if (width > 1) {
////                width = width / width;
////            }
////            //return 6;
//            
            
            //width = width * 10;
            //console.log(["aaa",width]);
            return width;
        };
        
        var calMarkerRefX = function (width) {
            console.log(width);
            return 0;
            return config.nodeR + 15 - (width * (config.nodeR + 10) );
        };
        
        var calMarkerRefY = function (width) {
            console.log(width);
            //return config.nodeR + 15 - (width * (config.nodeR + 10) );
            return 0;
        };
        
        var endAry = [];
        for (var _i = 0; _i < links.length; _i++) {
            endAry.push("end" + _i);
        }
        
        // build the arrow.
        svg.append("svg:defs").selectAll("marker")
                .data(endAry)      // Different link/path types can be defined here
                .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", String)
                .attr("viewBox", "0 -5 15 15")
                .attr("refX", function (d, i) {
                    return calMarkerRefX(adjStrWidth[i]);
                })
                //.attr("refY", -1.5)
                .attr("refY", function (d, i) {
                    return calMarkerRefY(adjStrWidth[i]);
                })
                .attr("markerWidth", function (d, i) {
                    
                    return calMarkerSize(adjStrWidth[i]);
                    //return 6;
                })
                .attr("markerHeight", function (d, i) {
                    return calMarkerSize(adjStrWidth[i]);
                    //return 6;
                })
                .attr("orient", "auto")
                .attr("class", "marker")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");
        
//        var markers = svg.selectAll("marker")
//        console.log(markers);
//        markers[0].forEach(function(marker) {
//            console.log(marker);
//            marker.markerWidth = 1;
//            marker.markerHeight = 1;
//        });
    }

// add the links and the arrows
    var pg = svg.append("svg:g").selectAll("path")
            .data(force.links())
            .enter().append("g");

    var path = pg.append("path")
            .attr("class", "link")
            //.attr("marker-end", "url(#end)")
            .attr("marker-end", function (d, i) {
                return "url(#end" + i +")";
            })
            .style("stroke-width", function (d, i) {
                //return d.value + 'px';
                //console.log(i);
                return adjStrWidth[i] + 'em';
            })
            .on("click", function (d, i) {
                if (typeof(d.linkClick) === "function") {
                    //console.log(d.linkClick);
                    d.linkClick();
                }
            });

    var text = pg.append("text")
            .text(function (d, i) {
                return d.label;
            })
            .style("fill", "black");

// define the nodes
    var node = svg.selectAll(".node")
            .data(force.nodes())
            .enter().append("g")
            .attr("class", "node")
            .call(force.drag)
            .on("click", function (d) {
                //console.log(d);
                if (typeof(d.nodeClick) === "function") {
                    d.nodeClick();
                }
            });

// add the nodes
    node.append("circle")
            .attr("r", config.nodeR);

// add the text 
    node.append("text")
            .attr("x", config.nodeR + 2)
            .attr("dy", ".65em")
            .text(function (d) {
                return d.name;
            })
            .on("click", function (d) {
                console.log(d);
                if (typeof(d.nodeClick) === "function") {
                    d.nodeClick();
                }
            });

// add the curvy lines
    function tick() {
        path.attr("d", function (d) {
            var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
             
//            var base = config.nodeR;
//            var x = d.target.x;
//            var y = d.target.y;
//            // 8
//            if (d.source.x === d.target.x && d.source.y > d.target.y) {
//                y = y + base;
//            }
//            // 9
//            else if (d.source.x < d.target.x && d.source.y > d.target.y) {
//                x = x - base;
//                y = y - base;
//            }
//            // 6
//            else if (d.source.x < d.target.x && d.source.y === d.target.y) {
//                //x = x - 30;
//                y = y - base;
//            }
//            // 3
//            else if (d.source.x < d.target.x && d.source.y < d.target.y) {
//                x = x + base;
//                y = y - base;
//            }
//            // 2
//            else if (d.source.x === d.target.x && d.source.y < d.target.y) {
//                x = x + base;
//                //y = y - 30;
//            }
//            // 1
//            else if (d.source.x > d.target.x && d.source.y < d.target.y) {
//                x = x + base;
//                y = y + base;
//            }
//            // 4
//            else if (d.source.x > d.target.x && d.source.y === d.target.y) {
//                //x = x + 30;
//                y = y + base;
//            }
//            // 7
//            else if (d.source.x > d.target.x && d.source.y > d.target.y) {
//                x = x - base;
//                y = y + base;
//            }
            
            var x =  ((dr - config.nodeR) * dx) / dr + d.source.x - config.nodeR;
            var y =  ((dr - config.nodeR ) * dy) / dr + d.source.y - config.nodeR;
            
            return "M" +
                    d.source.x + "," +
                    d.source.y + "A" +
                    dr + "," + dr + " 0 0,1 " +
                    x + "," +
                    y;
        });

        var base = 30;
        text.attr("transform", function (d) {
            var x = ((d.source.x - d.target.x) / 3 + d.target.x);
            var y = ((d.source.y - d.target.y) / 3 + d.target.y);
            // 8
            if (d.source.x === d.target.x && d.source.y > d.target.y) {
                x = x - base;
            }
            // 9
            else if (d.source.x < d.target.x && d.source.y > d.target.y) {
                x = x - base;
                y = y - base;
            }
            // 6
            else if (d.source.x < d.target.x && d.source.y === d.target.y) {
                //x = x - 30;
                y = y - base;
            }
            // 3
            else if (d.source.x < d.target.x && d.source.y < d.target.y) {
                x = x + base;
                y = y - base;
            }
            // 2
            else if (d.source.x === d.target.x && d.source.y < d.target.y) {
                x = x + base;
                //y = y - 30;
            }
            // 1
            else if (d.source.x > d.target.x && d.source.y < d.target.y) {
                x = x + base;
                y = y + base;
            }
            // 4
            else if (d.source.x > d.target.x && d.source.y === d.target.y) {
                //x = x + 30;
                y = y + base;
            }
            // 7
            else if (d.source.x > d.target.x && d.source.y > d.target.y) {
                x = x - base;
                y = y + base;
            }

            return "translate(" + x + "," + y + ")";
        });

        node
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
    }

//});

}
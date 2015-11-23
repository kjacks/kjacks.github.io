//GLOBAL VARIABLES

    //sets dimensions and margins of svg
    var m = [50, 120, 20, 85],
        w = 1280 - m[1] - m[3],
        h = 800 - m[0] - m[2],
        i = 0,
        root;

    var selectColor = "rgb(219,105,27)",
      primaryColor = "rgb(0,68,104)";

    //maximum depth of the tree, used to determine if node is leaf, FUTURE:should use a function to set
    var maxDepth = 4;

    //maximum descendents of any node (will always be the root) - used to determine max node size for scaling
    var maxDescend = 0;
    
    //used to add ... to long labels, build background rectangle
    var labelCutoff = 35;

    //stores facility opened by search
    var openedId = 0;

    //scale to determine node radius
    var radiusScale;

    //array of all facilities and categories searchable according to current filters - updated whenever filter changed
    var searchableFac = [];

    //stores filters that are currently toggled
    var currFilters = {
      boro : ['BK','BX','MN','QN','SI'],
      agency_oper : [],
      agency_over : [],
      age : []
    };

    var filterTot = {
      boro : 5,
      agency_oper : 0,
      agency_over : 0,
      age : 0
    };

    var allFilters = {
      boro : ['BK','BX','MN','QN','SI'],
      agency_oper : [],
      agency_over : [],
      age : []
    };

    //array with number of nodes open at each level
    var levelWidth;
    
    //map variables
    var map,
      marker,
      infowindow;

  //SETUP FUNCTIONS

    //initializes google maps instance
    initMap();

    var tree = d3.layout.tree()
        .size([h, w]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    var vis = d3.select("#body").append("svg:svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
      .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

    //Specify Data source here
    d3.json("data/SFPSDparsedattr1.json", function(json) {
      root = json;
      root.x0 = h / 2;
      root.y0 = 0;
      
      findAgencies();
      findSearchableFac();

      //sets up autocomplete search
      $( "#tags" ).autocomplete({
        source: searchableFac,
        appendTo: ".searchbar",
        select: function(event, input) {startSearch(input.item.value);}
      });      

      //orders children of each node in descending order
      orderChildren(root);

      //toggles initial display
      root.children.forEach(toggleAll);

      maxDescend = numDescend(root);

      //scale to determine node radius
      radiusScale = d3.scale.log()
                        .domain([1, maxDescend])
                        .range([1, 30]);

      update(root);
  
    });

    //UPDATE

    function update(source) {
      //stores current offset for each level to vertically space crowded nodes/labels
      var offset = [0,0,0,0,0];
      var duration = d3.event && d3.event.altKey ? 5000 : 500;

      //resizes svg if tree is too tall to fit 
      resizeSvg();

      // Computes the new tree layout.
      var nodes = tree.nodes(root).reverse();

      //sets y coordinates, counts descendants, offsets x coordinate to provide vertical spacing
      nodes.forEach(function(d) {
        d.y = d.depth * (d.depth == maxDepth ? 240 : 255);
        d.descend = numDescend(d);
        
        //calculates offset for vertical spacing
        var radius = d.descend > 0 ? radiusScale(d.descend) : 0;
        //if any level has more than 50 nodes open, applies spacing
        if (d3.max(levelWidth) >= 50) {
          if (d.depth != maxDepth) {
            offset[d.depth] += radius * (offset[d.depth] == 0 ? 1 : 2);
            //d.x = d.x - d.offset;
            d.x = d.x - offset[d.depth];
          }
        }
      });
      
      // Update the nodes…
      var node = vis.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("svg:g")
          .attr("class", "node")
          .attr("transform", function(d) {
           return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .on("click", function(d) {
            var svgh = d3.select("svg").attr("height");
            if (d.children || d._children) { 
              d3.select(this).select("text").attr("class", "selected");
              toggle(d) 
            } else {
              openedId += 1;
              d.opened = openedId;
              openMap(d); 
            }
            update(d);
            
            /*
            var newsvgh = d3.select("svg").attr("height");
            if (svgh != newsvgh) {
              var windowh = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;
              //d.children || d._children ? window.scroll(0, d.x - windowh/2) : null;
            }
            */
          })
          .on("mouseover", function(d) {
            d3.select(this).select("text").classed("default", false);
            d3.select(this).select("text").classed("hovered", function(d) {
              return d.children ? false : true;
            })
            //expands any hovered label regardless of length to full name
            d3.select(this).select("text").text(function(d) {return d.name;});
            
            //creates background rectangle for longer labels
            if (d.name.length > labelCutoff) {
              var xpadding = 4,
                  ypadding = 2,
                  defaultH = 12;
              var bbox = this.getBBox();
              
              var rect = d3.select(this).append("rect")
                .attr("x", bbox.x - xpadding)
                .attr("y", bbox.y + bbox.height/2 - defaultH/2 )
                .attr("width", (bbox.width - 15) + (xpadding * 2))
                .attr("height", defaultH)
                //.insertBefore()
                .style("fill", "white")
                .moveToBack();
            }  
            //d.depth < (maxDepth-1) && d.descend > 0 ? openPie(d) : null;
          })
          .on("mouseout", function(d) {
            //removes background white rectangle
            d3.select("rect").remove();  
            d3.select(this).select("text").classed("hovered", false);
            //if node is toggled (d.children == true) or it is the current opened facility (d.opened == openedId ), it is highlighted
            d3.select(this).select("text").attr("class", function(d) { return d.children || d.opened == openedId ? "selected" : "default"});
            //reapplies shortening of long labels
            d3.select(this).select("text").text(function(d) 
              {return d.name.length > labelCutoff ? d.name.substr(0,labelCutoff) + "..." : d.name;})
            //document.getElementById('pieContainer').style.visibility = "hidden";
            //$("#pieContainer").find("svg").remove("*");
            
          });

      nodeEnter.append("svg:circle")
          .attr("r", 1e-6)
          .style("fill", function(d) { return (d._children || d.depth == maxDepth) ? primaryColor : selectColor; });

      nodeEnter.append("svg:text")
          .attr("x", function(d) {
            var offset = 7 + (d.descend > 0 ? radiusScale(d.descend) : 0);
            return offset * (d.children || d._children ? -1 : 1); })
          .attr("dy", ".35em")
          .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
          .attr("class", function(d) {return d.children ? "selected" : "default";})
          .text(function(d) {
            return d.name.length > labelCutoff ? d.name.substr(0,labelCutoff) + "..." : d.name;})
          .style("fill-opacity", 1e-6);

      // adds label indicating number of descendents
      nodeEnter.append("svg:text")
          .attr("class", "desc")
          .attr("dy", function(d) {return d.depth == 0 ? "-.35em" : ".35em"})
          .attr("text-anchor", "middle")
          .attr("font-weight", "bold")
          .attr("fill", "white")
          .text(function(d) {
            var text = (d.descend >= 5 ? d.descend : null);
            return text; });
      
      // adds word Facilities to outermost mode
      nodeEnter.append("svg:text")
          .attr("class", "fac")
          .attr("dy", ".75em")
          .attr("text-anchor", "middle")
          .attr("font-weight", "bold")
          .attr("fill", "white")
          .text(function(d) {return d.depth == 0 && d.descend > 1 ? " Facilities" : null;});

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      nodeUpdate.select("circle")
          .attr("r", function(d) {return d.descend ? radiusScale(d.descend) : .1;})
          .style("fill", function(d) { return (d._children || d.depth == maxDepth) ? primaryColor : selectColor; })
          .style("stroke", "none");

      nodeUpdate.select("text")
          .style("fill-opacity", 1)
          .attr("class", function(d) {return d.children || d.opened == openedId ? "selected" : "default";});

      nodeUpdate.select(".desc")
        .text(function(d) {
            var text = (d.descend >= 5 ? d.descend : null);
            return text; });

      nodeUpdate.select(".fac")
        .text(function(d) {return d.depth == 0 && d.descend > 1 ? " Facilities" : null;});

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
          .remove();

      nodeExit.select("circle")
          .attr("r", 1e-6);

      nodeExit.select("text")
          .style("fill-opacity", 1e-6);

      // Update the links…
      var link = vis.selectAll("path.link")
          .data(tree.links(nodes), function(d) { return d.target.id; });

      // Enter any new links at the parent's previous position.
      link.enter().insert("svg:path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          })
        .transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
  }

//PRIMARY TREE RENDERING FUNCTIONS

  function toggle(d) {
    if (d.children) {
      d._children = d.hidden_children ? d.children.concat(d.hidden_children) : d.children;
      d.children = null;
      d.hidden_children = null;
    } else {
      d.children = [];
      for (var i = 0; i < d._children.length; i++) {
        if(d._children[i].hasOwnProperty('attr')) {
          if(checkFilters(d._children[i])) {
            d.children.push(d._children[i]);
          } else {
            d.hidden_children ? d.hidden_children.push(d._children[i]) : d.hidden_children = [d._children[i]];
          }
        } else {
          d.children.push(d._children[i]);
        }
      }
      d._children = null;
    }
  }

  function toggleAll(d) {
    if (d.children) {
      orderChildren(d);
      d.children.forEach(toggleAll);
      toggle(d);
    }
  }

  function orderChildren(d) {
    if (d.children) {
      d.children = d.children.sort(function (a, b) {
        if (numDescend(a) > numDescend(b)) {return -1;}
        if (numDescend(a) < numDescend(b)) {return 1;}
        // a must be equal to b
        return 0;
      });
    } else if (d._children) {
      d._children = d._children.sort(function (a, b) {
        if (numDescend(a) > numDescend(b)) {return -1;}
        if (numDescend(a) < numDescend(b)) {return 1;}
        // a must be equal to b
        return 0;
      });
    }
  }

  //calculates level with max number of nodes open, stores currently open nodes for each level in levelWidth array
  function resizeSvg() {
    levelWidth = [1];
    var childCount = function(level, n) {
      if (n.children && n.children.length > 0) {
        if (levelWidth.length <= level + 1) levelWidth.push(0);

        levelWidth[level + 1] += n.children.length;
        n.children.forEach(function(d) {
            childCount(level + 1, d);
        });
      }
    };
    childCount(0, root);
    //resizes tree based on level with most nodes open, only resizes if there is a level with greater than 50, otherwise sets to default height
    if(d3.max(levelWidth) >= 50) {
      var newHeight = d3.max(levelWidth) * 15; // 15 pixels per line  
      tree.size([newHeight, w]);
      d3.select("svg").attr("height", newHeight + m[0]);

    } else {
      tree.size([h, w]);
      d3.select("svg").attr("height", h + m[0] + m[2]);
    }
  }

  function numDescend(node) {
    var totDescend = 0;
    visit(node, function(d) {
          if(!(d.children || d._children)) {
            if(checkFilters(d)) {
              totDescend++;
            }
          }
      }, function(d) {
          var ret_value = d.children && d.children.length > 0 || d._children && d._children.length > 0 ? d.children || d._children : null;
          return ret_value;
      });
    return totDescend;
  }

//FILTER FUNCTIONS

  function findAgencies() {
    var agency_over = new Set();
    var agency_oper = new Set();

    visit(root, function(d) {
        d.children || d._children ? null : agency_over.add(d.attr.NewAgencyOver_Decode);
        d.children || d._children ? null : agency_oper.add(d.attr.NewAgencyOper_Decode);

    }, function(d) {
        if (d.children && d.children.length > 0) {
          return d.children; 
        } else if (d._children && d._children.length > 0) {
          return d._children;
        }
    });

    filterTot.agency_over = agency_over.length;
    filterTot.agency_oper = agency_oper.length;

    agency_over.forEach(function(a) {
      $('#agencyOver').append("<li><a href='#' class='small agency_over' data-value='" + a + "' tabIndex='-1'><input type='checkbox' checked='true'/>&nbsp;" + a + "</a></li>");
      currFilters.agency_over.push(a);
      allFilters.agency_over.push(a);
    }); 

    agency_oper.forEach(function(a) {
      $('#agencyOper').append("<li><a href='#' class='small agency_oper' data-value='" + a + "' tabIndex='-1'><input type='checkbox' checked='true'/>&nbsp;" + a + "</a></li>");
      currFilters.agency_oper.push(a);
      allFilters.agency_oper.push(a);
    });

    $( '.dropdown-menu a:not(.all) ' ).on( 'click', function( event ) {
    var cls = this.classList[1];
    var clsSelector = '.' + cls;
    
    
    var filterChanged = findFilter($(this).attr("class").slice(6));


     var $target = $( event.currentTarget ),
         val = $target.attr( 'data-value' ),
         $inp = $target.find( 'input' ),
         idx;

         console.log(val);

      if ( ( idx = filterChanged.filter.indexOf( val ) ) > -1 ) {
        filterChanged.filter.splice( idx, 1 );
        setTimeout( function() { $inp.prop( 'checked', false ) }, 0);
        $(clsSelector + ".all").find('input').prop('checked', false);
      } else {
        filterChanged.filter.push( val );
        setTimeout( function() { $inp.prop( 'checked', true ) }, 0);
        var otherToggles = $(clsSelector).find('input');
        var toggleAll = true;
        console.log(otherToggles);
        for (var i = 1; i < otherToggles.length; i++) {
          console.log(otherToggles[i].checked);
          if (otherToggles[i].checked == false) {
            toggleAll = false;
          } 
        }
        toggleAll ? $(clsSelector + ".all").find('input').prop('checked', true) : null;
      }
    

     $( event.target ).blur();
        
     console.log( currFilters );

     tree.nodes(root).reverse().forEach(function(d) {
        if(d.depth == (maxDepth - 1) && d.children || d.hidden_children) {
          toggle(d);
          toggle(d);
        }
      });

     update(root);
     findSearchableFac();
     $( "#tags" ).autocomplete({
        source: searchableFac 
     });
     return false; 
    });

  }

  $( '.all' ).on( 'click', function( event ) { 
    var cls = this.classList[1];
    
    var filterChanged = findFilter(cls);
    cls = "." + cls;
    var isChecked;
    if (filterChanged.filter.length > 0) {
      isChecked = true; 
    } else {
      isChecked = false;
    } 
    console.log(isChecked);

    $(cls).find('input').prop('checked', false);
    

    
    if (true) {
      while(filterChanged.filter.length > 0) {filterChanged.filter.pop(); }
    } else {
      while(filterChanged.filter.length > 0) {filterChanged.filter.pop(); }
      for ( var i = 0; i < filterChanged.allfilter.length; i++) {
        filterChanged.filter.push(filterChanged.allfilter[i]);
      }
    }
    
    console.log(currFilters);
    console.log(allFilters);
    /*
    if(filterChanged.max == filterChanged.filter.length) {
      $(cls).find( 'input' ).prop("checked", false);
      filterChanged.filter = [];
    } else {
      $(cls).find( 'input' ).prop("checked", true);
    }
    */

    console.log( currFilters );

     tree.nodes(root).reverse().forEach(function(d) {
        if(d.depth == (maxDepth - 1) && d.children || d.hidden_children) {
          toggle(d);
          toggle(d);
        }
      });

     update(root);
     findSearchableFac();
     $( "#tags" ).autocomplete({
        source: searchableFac 
     });
     return false;
  });

  function checkFilters(fac) {
  if (isIn(String(fac.attr.Borough), currFilters.boro) &&
    isIn(String(fac.attr.NewAgencyOper_Decode), currFilters.agency_oper) &&
    isIn(String(fac.attr.NewAgencyOver_Decode), currFilters.agency_over)) {
    //ADD AGE COHORT TOO
    return true;
  } else {
    return false;
  }
}
  

  function findFilter(whichFilter) {
    var filterInfo = {
      filter : [],
      allfilter: []
    };

    switch(whichFilter) {
      case "boro":
        filterInfo.filter = currFilters.boro;
        filterInfo.allfilter = allFilters.boro;
        break;
      case "agency_oper":
        filterInfo.filter = currFilters.agency_oper;
        filterInfo.allfilter = allFilters.agency_oper;
        break;
      case "agency_over":
        filterInfo.filter = currFilters.agency_over;
        filterInfo.allfilter = allFilters.agency_over;
        break;
      case "age":
        filterInfo.filter = currFilters.age;
        filterInfo.allfilter = allFilters.age;
        break;
    }

    return filterInfo;
  }

  function filterAll(filterChanged, filterMax, event) {
    var $target = $( event.currentTarget ),
         $inp = $target.find( 'input' ),
         idx,
         cls = "." + event.currentTarget.className;

    //all are selected -> unselect all
    if (filterChanged.length == filterMax) {
      filterChanged = [];
      var cls = target.classList[1];
      cls = "." + cls;
      $(cls).find( 'input' ).prop("checked", false);
      setTimeout( function() { $inp.prop( 'checked', false ) }, 0);
    }
  }

//SEARCH FUNCTIONS
var foundCoord = [];
var found = false;

  function findSearchableFac() {
    console.log("finding searchable facilities");
    searchableFac = [];

    visit(root, function(d) {
          if(d.children || d._children) {
            searchableFac.push(d.name)
          } else {
            checkFilters(d) ? searchableFac.push(d.name) : null;
          }
      }, function(d) {
          if (d.children && d.children.length > 0) {
            return d.children; 
          } else if (d._children && d._children.length > 0) {
            return d._children;
          }
      }
    );
  }

  function startSearch(fac) {
    foundCoord = [];
    found = false;
    console.log("starting search");
    //var toFind = (document.getElementById('tags').value).toLowerCase();
    var toFind = fac.toLowerCase();
    console.log(toFind);
    findFacility(toFind, root);
    console.log("foundCoord: " + foundCoord);
    if (foundCoord.length < 1) {
      alert(toFind + " not found");
    } else {
      console.log("opening tree");
      openTree(foundCoord);
    }

    $("searchbar.ui-widget.input").val('');
  }

function findFacility(facility, node) {
  if (node == null || found == true) {
    return;
  }
  if (node.hasOwnProperty("children") == false) {
    return;
  }

  var count = 0;
  var ch = [];
  if (node.children == null) {
    count = node._children.length;
    ch = node._children;
  } else {
    count = node.children.length;
    ch = node.children;
  }
    for (var i = 0; i < count; i++) {
      if (ch[i].name.toLowerCase() == facility) {
        console.log("found!");
        foundCoord.push(i);
        found = true;
        return;
      } else {
        findFacility(facility, ch[i]);
        if (found == true) {
          foundCoord.push(i);
          return;
        }
      }
    }
  
}

function openTree(foundCoord) {
  var curr = root;
  console.log(foundCoord);
  while (foundCoord.length > 0) {
    var index = foundCoord.pop();
    if (curr.children) {
      curr = curr.children[index];
    } else if (curr._children) {
      toggle(curr);
      curr = curr.children[index];
    }

    if (foundCoord.length == 0 && !(curr.children || curr._children)) {
      openMap(curr);
      console.log(curr);
      openedId += 1;
      curr.opened = openedId;
      
      console.log(curr.x);
      var windowh = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;
      
      window.scroll(0, curr.x - windowh/2);
    }
  }
    update(root);
}

//FACILITY INFO WINDOW FUNCTIONS

  function initMap() {
    console.log("initializing map");
    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -40.7127, lng: 74.0059},
      scrollwheel: true,
      zoom: 15
    });
  }

  //closes info window when user clicks somewhere else on screen
  d3.select("#body:not(#facWindow)").on("click", function() { 
    document.getElementById('facWindow').style.visibility = "hidden";
  });

  function openMap(fac) {
    findNewCenter(fac);

    //map.setCenter(new google.maps.LatLng(37.4419, -122.1419));
    map.addListener('center_changed', function() {
      document.getElementById('facWindow').style.visibility = "visible";
      $("#facName").text(fac.name);

      $("#facAttr").find("li").eq(0).text("Borough: " + fac.attr.Borough);
      $("#facAttr").find("li").eq(1).text("Address: " + fac.attr.FacAddress);

      //sets facility info window position - if window overlaps with banner, shifts down
      document.getElementById('facWindow').style.top = fac.x < 115 ? "45px" : (fac.x - 70) + "px";
      document.getElementById('facWindow').style.left = (fac.y - 280) + "px";
      var windowh = window.innerHeight
              || document.documentElement.clientHeight
              || document.body.clientHeight;
      window.scroll(0, fac.x - windowh/2);
    });
  }

  function findNewCenter(fac) {
    var address = fac.attr.FacAddress + ", New York, New York";

    var geocoder = new google.maps.Geocoder();
    if (geocoder) {
        geocoder.geocode( { 'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
           
            map.setCenter(results[0].geometry.location);
            if (!infowindow) {
                infowindow = new google.maps.InfoWindow(
                { content: '<b>'+fac.name+'</b>',
                  size: new google.maps.Size(150,50)
                });
            } else {
              infowindow.setContent('<b>'+fac.name+'</b>');
            }
            if (!marker) {  
               marker = new google.maps.Marker({
                  position: results[0].geometry.location,
                  map: map, 
                  title:address
              });
            } else {
              marker.setPosition(results[0].geometry.location);
            } 
              google.maps.event.addListener(marker, 'click', function() {
                  infowindow.open(map,marker);
              });

            } else {
              alert("No results found");
            }
          } else {
            alert("Geocode was not successful for the following reason: " + status);
          }
        });
      }
  }

//HELPER FUNCTIONS

  // A recursive helper function for performing some setup by walking through all nodes
  function visit(parent, visitFn, childrenFn) {
    if (!parent) return;

    visitFn(parent);

    var children = childrenFn(parent);
    if (children) {
      var count = children.length;
      for (var i = 0; i < count; i++) {
        visit(children[i], visitFn, childrenFn);
      }
    }
  }

  function isIn(value, array) {
    return array.indexOf(value) > -1;
  }

  function arraysEqual(a, b) {
    if (a.length != b.length) {
      return false;
    }

    a.sort();
    b.sort();

    if (JSON.stringify(a) == JSON.stringify(b)) {
      return true;
    } else {
      return false;
    }
  }
  
//utility function to move white bounding rectangle behind text
  d3.selection.prototype.moveToBack = function() { 
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    }); 
  };





/*
function toggleBorough(b, allToggled) {
  
  if (allToggled) {
    currBoroughs = [];
    currBoroughs.push(b);
  } else {
    if (currBoroughs.indexOf(b) < 0) {
      currBoroughs.push(b);
    } else {
      currBoroughs.splice(currBoroughs.indexOf(b), 1);
    } 
  }

  tree.nodes(root).reverse().forEach(function(d) {
    if(d.depth == (maxDepth - 1) && d.children || d.hidden_children) {
      toggle(d);
      toggle(d);
    }
  });
  
  if (arraysEqual(currBoroughs, boroughs)) {  
    $("#all").addClass('active');
  } else {
    $("#all").removeClass('active');
  }
  console.log(currBoroughs);
  update(root);
}

function boroughCode(borough) {
  switch(borough) {
    case "Brooklyn": 
      return 'BK';
      break;
    case "Manhattan": 
      return 'MN';
      break;
    case "Bronx": 
      return 'BX';
      break;
    case "Queens": 
      return 'QN';
      break;
    case "Staten Island": 
      return 'SI';
      break;
  }
}
*/
/*
function drawPie(fac) {
  var data = fac.children ? fac.children : fac._children;
  
  var dataLength = data.length;
  
  dataLength = dataLength < 3 ? 3 : dataLength;
  dataLength = dataLength > 9 ? 9 : dataLength;

  var piesvgw = 280,
    piesvgh = 200,
    piew = 180,
    pieh = 180,
    radius = Math.min(piew, pieh) / 2;

  var color = d3.scale.ordinal()
      .range(colorbrewer.GnBu[dataLength]);

  var arc = d3.svg.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.descend; });

  var piesvg = d3.select("#pieContainer").append("svg")
      .attr("width", piesvgw)
      .attr("height", piesvgh)
      .attr("visibility", "normal")
    .append("g")
      .attr("transform", "translate(" + piesvgw / 2 + "," + piesvgh / 2 + ")");

  
  data.forEach(function(d) {
    d.descend = numDescend(d);
    //d.descend = +d.population;
  });

    var g = piesvg.selectAll(".arc")
        .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("opacity", ".7")
        .style("fill", function(d) { return color(d.data.name); });

    g.append("text")
        .attr("transform", function(d) {
          return "translate(" + 
            ( (radius - 12) * Math.sin( ((d.endAngle - d.startAngle) / 2) + d.startAngle ) ) +
            ", " +
            ( -1 * (radius - 12) * Math.cos( ((d.endAngle - d.startAngle) / 2) + d.startAngle ) ) +
          ")";
         })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("font-size", "8px")
        .text(function(d) { return d.data.name; }); 
}

  

$(".long").mouseover(function() {
    console.log("scrolling");
    //$(this).removeClass("ellipsis");
    var maxscroll = $(this).width();
    var speed = maxscroll * 15;
    $(this).animate({
        scrollLeft: maxscroll
    }, speed, "linear");
});

$(".long").mouseout(function() {
    $(this).stop();
    //$(this).addClass("ellipsis");
    $(this).animate({
        scrollLeft: 0
    }, 'slow');
});
*/

/*
    // Call visit function to establish maxLabelLength
    visit(root, function(d) {
        //totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });

    function findOverlap(node) {
  if (node.hasOwnProperty('parent')) {
    if (node.parent.hasOwnProperty('parent')) {
      var parofpar = node.parent.parent;
      for (var i = 0; i < parofpar.children.length; i++) {
        if((parofpar.children[i].x >= (node.x - 15)) && (parofpar.children[i].x <= (node.x + 15))) {
          return true;
        }
      }
    }
  }
}


function openPie(fac) {
  //console.log(fac);
  drawPie(fac);
  $("#catName").text(fac.name);
  document.getElementById('pieContainer').style.visibility = "visible";
  //sets pie position - if window overlaps with banner, shifts down
  document.getElementById('pieContainer').style.top = fac.x < 115 ? "45px" : (fac.x - 70) + "px";
  document.getElementById('pieContainer').style.left = (fac.y + 90) + "px";

}

*/    
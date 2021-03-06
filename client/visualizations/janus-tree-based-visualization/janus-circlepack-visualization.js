JanusCirclePackVisualization = function(id) {
	this.id = id;
    this.tree = new Tree();

    this.svg = {};
    this.pack = {};

	this.w = 1280;
	this.h = 800;
	this.r = 720;

    this.x = {};
    this.y = {};

    this.node = {};
    this.root = {};
};

/**
 * Adds an interaction in the visualization
 *  interaction : the interaction to add
 */ 
JanusCirclePackVisualization.prototype.addInteraction = function(interaction) {
    var headers, msg;

    headers = JSON.parse(interaction.headers);
    msg = JSON.parse(interaction.body);	
            
    if(headers && msg) {
    	if(headers[janus_events["event-type"]] == janus_events["member-joined"]) {
            if(msg.agentID && msg.parentContextID) {
            	if(this.tree.nodeCount == 0) {
                    // add root
                    var node = new TreeNode(msg.parentContextID);
                    node.size = 5000;
                    this.tree.addNode(node, null);
                } 
                var node = new TreeNode(msg.agentID);
                node.size =  5000;
                this.tree.addNode(node, msg.parentContextID);
            }
        }
    }
};

/** 
 * Update the d3 visualization
 */
JanusCirclePackVisualization.prototype.update = function() {
	if(this.tree.root != null) {
		var jpv = this;
		this.node = this.root = this.tree;

		var nodes = this.pack.nodes(this.tree.root);

	    d3.selectAll(this.id + " text").remove();
	    d3.selectAll(this.id + " circle").remove();

		this.svg.selectAll("circle")
			.data(nodes)
			.enter().append("svg:circle")
			.attr("class", function(d) { return d.children ? "parent" : "child"; })
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; })
			.attr("r", function(d) { return d.r; })
            .on("mouseover", function(d) { jpv.displayText(d.name, true); })
            .on("mouseout", function(d) { jpv.displayText(d.name, false); })
			.on("click", function(d) { return jpv.zoom(jpv.node == d ? jpv.root : d); });

		this.svg.selectAll("text")
		  	.data(nodes)
			.enter().append("svg:text")
			.attr("class", function(d) { return Utils.packJanusId(d.name); })
			//.attr("class", function(d) { return d.children ? "parent" : "child"; })
			.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y; })
			.attr("dy", ".35em")
			.attr("text-anchor", "middle")
            .attr("visibility", "hidden")
			.style("opacity", function(d) { return d.r > 20 ? 1 : 0; })
			.text(function(d) { return d.name; });

		d3.select(window).on("click", function() { jpv.zoom(jpv.root); });
	}
};

/**
 * Build the layout and the svg
 */
JanusCirclePackVisualization.prototype.build = function() {
    this.x = d3.scale.linear().range([0, this.r]);
    this.y = d3.scale.linear().range([0, this.r]);

	this.pack = d3.layout.pack()
		.size([this.r, this.r])
		.value(function(d) { return d.size; })

	this.svg = d3.select(this.id)
		.attr("width", this.w)
		.attr("height", this.h)
		.append("svg:g")
		.attr("transform", "translate(" + (this.w - this.r) / 2 + "," + (this.h - this.r) / 2 + ")");
};


/**
 * WIP : not functionnal -- was intended to make a zoom in the circle pack visualization
 */
JanusCirclePackVisualization.prototype.zoom = function(d, i) {
	var k = this.r / d.r / 2;
	this.x.domain([d.x - d.r, d.x + d.r]);
	this.y.domain([d.y - d.r, d.y + d.r]);

	var t = this.svg.transition()
	  .duration(d3.event.altKey ? 7500 : 750);

	t.selectAll(this.id + "circle")
	  .attr("cx", function(d) { return this.x(d.x); })
	  .attr("cy", function(d) { return this.y(d.y); })
	  .attr("r", function(d) { return k * d.r; });

	t.selectAll(this.id + "text")
	  .attr("x", function(d) { return this.x(d.x); })
	  .attr("y", function(d) { return this.y(d.y); })
	  .style("opacity", function(d) { return k * d.r > 20 ? 1 : 0; });

	this.node = d;
	d3.event.stopPropagation();
};

JanusCirclePackVisualization.prototype.displayText = function(id, visible) {
    d3.selectAll(this.id + " text." + Utils.packJanusId(id))
        .attr("visibility", visible ? "visible" : "hidden");
};

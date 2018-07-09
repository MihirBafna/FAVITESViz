/*------------------------------------------------------------------------------
FAVITESViz is a tool for visualizing the output of FAVITES
(FrAmework for VIral Transmission and Evolution Simulation)

FAVITESViz was built mainly using the Cytoscape Library, as well as other
dependencies credited below.

Dependencies:
cytoscape-qtip extension
cytoscape-coSE-bilkent extension for layouts:
U. Dogrusoz, E. Giral, A. Cetintas, A. Civril, and E. Demir,
"A Layout Algorithm For Undirected Compound Graphs", Information Sciences,
179, pp. 980-994, 2009.
 -----------------------------------------------------------------------------*/

/*------------------------ Initializing variables ----------------------------*/

// hiding elements that need to be hidden upon initialization //
  $('#backbtn').hide(0);

// global variables //
var nodeID = null;
var nodeTreeElements = [];
var notNodeTree = [];
var transmissionElements = [];

 // Cytoscape initializing empty main contact/transmission graph //
 var cy = cytoscape({
 	container: document.getElementById('cy'),
 	boxSelectionEnabled: false,
 	autoungrabify: true,
 	elements: [
 	],
 	style: [
 		{
 			selector: 'node',
 			style:
 				{'background-color': '#e3eaf4',
 					'width':'30',
 					'height':'30'}
 		},
 		{
 			selector: '.transmission_node',
 			style:
 				{'background-color': '#bc0101',
 					'width':'30',
 					'height':'30'}
 		},
 		{
 			selector: 'edge',
 			style:
 			{'width': 0.3,
 			'curve-style': 'bezier',
 			'target-arrow-color': '#ddd'}
 		},
    {
 			selector: '.transmission_edge',
 			style:
 			{'width': 3,
 			'line-color': '#bc0101',
 			'transition-property': 'background-color, line-color, target-arrow-color',
 			'transition-duration':'0.7s',
 			}
 		},
    // nodetree style for nodes/edges //
    {
      selector: '.Neighborhood',
      style:
      {'background-color': '#FFFFFF',
      },
    },
    {
      selector: '.notNeighborhood',
      style:
      {
      'background-color': '#000000',
      'line-color':'#000000',
      }
    },
 	]
 });

/*--------------------------- Function Definitions ---------------------------*/

 // Main function //
 window.onload = function() {
	contacttransmitGraph();
  cy.on('click','node',function(){
    nodeID= this.id();
    nodeTreeView(nodeID);
  });
 };

// Initializing the graph with both contact and transmission network files //
function contacttransmitGraph(){
    // Reading FAVITES FILE //
		var contactInput = document.getElementById('contactInput');
    var transmissionInput = document.getElementById('transmissionInput');
		var fileDisplayArea = document.getElementById('fileDisplayArea');
		// Contact Network file reading and displaying //
		contactInput.addEventListener('change', function(e) {
			var file = contactInput.files[0];
			var textType = /text.*/;
			if (file.type.match(textType)) {
				$(function(){
					$('#inputFile1').fadeOut("slow");
				});
				var reader = new FileReader();
        reader.onload = function(e){
          var contactLines = reader.result.split("\n");
          // Iterating and adding each element to cytest graph //
          for (i=0; i < contactLines.length; i++){
            var contactArray = contactLines[i].split("\t");
          // ADDING NODES //
            if (contactArray[0] === "NODE"){
              cy.add({group: "nodes",data:{id: contactArray[1]}});
            }
          // ADDING EDGES //
            else if (contactArray[0] === "EDGE"){
              cy.add({group: "edges", data: {id: contactArray[1]+contactArray[2],source: contactArray[1], target: contactArray[2]}});
            }
          }
        /*  // Qtip code for each node//
          cy.nodes().qtip({
  					content: function(){
              return this.id()
            },
  					position: {
  						my: 'top center',
  						at: 'bottom center'
  					},
  					style: {
  						classes: 'qtip-bootstrap',
  						tip: {
  							width: 10,
  							height: 8
  						}
  					}
  				});*/

					// Cytoscape Layout function //
					cy.layout({
						name:'cose-bilkent',
						fit: true,
						nodeRepulsion: 1000000000,
						avoidOverlap: true
					}).run();
        }
      reader.readAsText(file);
      }
    })
		// Transmission Network file reading and displaying //
    transmissionInput.addEventListener('change', function(e) {
      var file = transmissionInput.files[0];
      var textType = /text.*/;
      if (file.type.match(textType)) {
				$(function(){
					$('#inputFile2').fadeOut("slow");
				});
        var reader = new FileReader();
        reader.onload = function(e){
          var transmitLines = reader.result.split("\n");
          // iterating and plotting the transmission nodes //
          for (i=0; i < transmitLines.length; i++){
            var transmitArray = transmitLines[i].split("\t");
						// checking for empty line or hashtag at the end of file //
						if (transmitArray[0].length == 0){
							console.log('empty line');
						}
            else if (transmitArray[0] === "None"){
              cy.$('#'+transmitArray[1]).classes('transmission_node');
            }
						// checking if edge ID (Node1Node2) exists  //
						else if(cy.$('#'+transmitArray[0]+transmitArray[1]).length){
							cy.$('#'+transmitArray[0]+transmitArray[1]).classes('transmission_edge');
							cy.$('#'+transmitArray[1]).classes('transmission_node');
						}
						// checking if edge ID (Node2Node1) exists //
						else if(cy.$('#'+transmitArray[1]+transmitArray[0]).length){
							cy.$('#'+transmitArray[1]+transmitArray[0]).classes('transmission_edge');
							cy.$('#'+transmitArray[1]).classes('transmission_node');
						}
						// error message in case nodes/edges were not defined in the contact network (for developer usage) //
						else{
							console.log('The edge with ID '+transmitArray[0]+transmitArray[1]+' or '+transmitArray[1]+transmitArray[0]+' does not exist.');
						}
          }
        }
      reader.readAsText(file);
      }
    })
}

/*---------- functions for user manipulation after graph initializes ---------*/

// individual node tree view //
function nodeTreeView(nodeTreeID){
  nodeTreeElements = cy.$('#'+nodeTreeID).closedNeighborhood();
  notNodeTree = cy.elements().not(nodeTreeElements);
  if(nodeTreeElements !== null){
    notNodeTree.toggleClass('notNeighborhood',true);
    nodeTreeElements.addClass('Neighborhood',true);
    $('#backbtn').show(0);
//Resetting the graph when back button is pressed //
    backbtn.addEventListener('click',function(){
      notNodeTree.toggleClass('notNeighborhood',false);
      nodeTreeElements.addClass('Neighborhood',false);
    });
  }
}

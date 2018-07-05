/*
FAVITESViz is a tool for visualizing the output of FAVITES
(FrAmework for VIral Transmission and Evolution Simulation)

FAVITESViz was built using the Cytoscape Library, as well as other dependencies credited below.

Dependencies:
cytoscape-qtip extension
cytoscape-coSE-bilkent extension for layouts:
U. Dogrusoz, E. Giral, A. Cetintas, A. Civril, and E. Demir,
"A Layout Algorithm For Undirected Compound Graphs", Information Sciences,
179, pp. 980-994, 2009.
 */


window.onload = function() {
    // Reading FAVITES FILE //
		var contactInput = document.getElementById('contactInput');
    var transmissionInput = document.getElementById('transmissionInput');
		var fileDisplayArea = document.getElementById('fileDisplayArea');
    // Cytoscape initializing empty list of elements //
    var cy = cytoscape({
      container: document.getElementById('cy'),
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
					'transition-duration': '0.5s'}
        },
      ]
    });
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
          var allLines = reader.result.split("\n");
          // Iterating and adding each element to cytest graph //
          for (i=0; i < allLines.length; i++){
            var miniArray = allLines[i].split("\t");
          // ADDING NODES //
            if (miniArray[0] === "NODE"){
              cy.add({group: "nodes",data:{id: miniArray[1]}});
            }
          // ADDING EDGES //
            else if (miniArray[0] === "EDGE"){
              cy.add({group: "edges", data: {id: miniArray[1]+miniArray[2],source: miniArray[1], target: miniArray[2]}});
            }
          }
          // Qtip code for each node//
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
  				});
          // Cytoscape Layout function //
					cy.layout({
						name:'cose-bilkent',
						fit: true,
						nodeRepulsion: 1000000000
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
          var allLines = reader.result.split("\n");
          // iterating and plotting the transmission nodes //
          for (i=0; i < allLines.length; i++){
            var miniArray = allLines[i].split("\t");
						// checking for empty line or hashtag at the end of file //
						if (miniArray[0].length == 0){
							console.log('empty line');
						}
            else if (miniArray[0] === "None"){
              cy.$('#'+miniArray[1]).classes('transmission_node');
            }
						// checking if edge ID (Node1Node2) exists  //
						else if(cy.$('#'+miniArray[0]+miniArray[1]).length){
							cy.$('#'+miniArray[0]+miniArray[1]).delay(miniArray[2]*1000).classes('transmission_edge');
							cy.$('#'+miniArray[1]).classes('transmission_node');
						}
						// checking if edge ID (Node2Node1) exists //
						else if(cy.$('#'+miniArray[1]+miniArray[0]).length){
							cy.$('#'+miniArray[1]+miniArray[0]).classes('transmission_edge');
							cy.$('#'+miniArray[1]).classes('transmission_node');
						}
						// error message in case nodes/edges were not defined in the contact network (for developer usage) //
						else{
							console.log('The edge with ID '+miniArray[0]+miniArray[1]+' or '+miniArray[1]+miniArray[0]+' does not exist.');
						}
          }
          // Qtip code for each node //
        /*  cy.nodes().qtip({
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
          }); */
        }
      reader.readAsText(file);
      }
    })
  };

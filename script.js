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
          {'width': 0.3,}
        },
        {
          selector: '.transmission_edge',
          style:
          {'width': 3,
            'line-color': '#bc0101'}
        },
      ]
    });
// Contact Network file reading and displaying //
		contactInput.addEventListener('change', function(e) {
			var file = contactInput.files[0];
			var textType = /text.*/;
			if (file.type.match(textType)) {
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
						name:'concentric'
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
        var reader = new FileReader();
        reader.onload = function(e){
          var allLines = reader.result.split("\n");
          // iterating and plotting the transmission process //
          for (i=0; i < allLines.length; i++){
            var miniArray = allLines[i].split("\t");
            if (miniArray[0] === "None"){
              cy.$('#'+miniArray[1]).classes('transmission_node');
            }
						// checking if edge ID (Node2Node1) exists //
						else if(cy.$('#'+miniArray[1]+miniArray[0]).length){
							console.log(miniArray[1]+miniArray[0]);
							cy.$('#'+miniArray[1]+miniArray[0]).classes('transmission_edge');
							cy.$('#'+miniArray[1]).classes('transmission_node');
						}
						// checking if edge ID (Node1Node2) exists  //
            else if(cy.$('#'+miniArray[0]+miniArray[1]).length){
							console.log(miniArray[0]+miniArray[1]);
              cy.$('#'+miniArray[0]+miniArray[1]).classes('transmission_edge');
							console.log(cy.$('#'+miniArray[0]+miniArray[1]).classes('transmission_edge'));
							cy.$('#'+miniArray[1]).classes('transmission_node');
            }
						else{
							alert('The edge with ID '+miniArray[0]+miniArray[1]+' or '+miniArray[1]+miniArray[0]+' does not exist.');
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

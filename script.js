//$(function(){
  window.onload = function() {
    // Reading FAVITES FILE //
		var fileInput = document.getElementById('fileInput');
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
          selector: 'edge',
          style:
          {'width': 0.3,
            'background-color': '#FFFFFF',}
        }
      ]
    });

		fileInput.addEventListener('change', function(e) {
			var file = fileInput.files[0];
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
              cy.add({group: "nodes",data:{id:'NODE' + miniArray[1]}});
            }
          // ADDING EDGES //
            else if (miniArray[0] === "EDGE"){
              cy.add({group: "edges", data: {id: miniArray[1]+miniArray[2],source: "NODE"+miniArray[1], target: "NODE"+miniArray[2]}});
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

					cy.layout({
						name:'concentric'
					}).run();
        }
      reader.readAsText(file);
      }
    })
  };
//});

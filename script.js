/*------------------------------------------------------------------------------
FAVITESViz is a tool for visualizing the output of FAVITES
(FrAmework for VIral Transmission and Evolution Simulation)

FAVITESViz was built mainly using the Cytoscape Library, as well as other
dependencies credited below.

Dependencies:
chart.js
cytoscape-qtip extension
cytoscape-coSE-bilkent extension for layouts:
U. Dogrusoz, E. Giral, A. Cetintas, A. Civril, and E. Demir,
"A Layout Algorithm For Undirected Compound Graphs", Information Sciences,
179, pp. 980-994, 2009.
 -----------------------------------------------------------------------------*/

/*------------------------ Initializing variables ----------------------------*/

// hiding elements upon initialization //
$('#backbtn').hide(0);
$('#animationBtn').hide(0);

// global variables //
var transmissionDelay = 0;
var curedDelay = 0;
var nodeID = null;
var nodeTreeElements = [];
var notNodeTree = [];
var playtransmission = false;
var nodeSelectMode = false;
var showIndividualMode = false;
var showMainmode = false;
var transmitDone = false;
var infectData = [];
var infectLabels = [];
var curedData = [];
var animDuration = 0;
var nodeInfo = [];
var counter = 0;

// Cytoscape initializing empty main contact/transmission graph //
var cy = cytoscape({
  container: document.getElementById('cy'),
  boxSelectionEnabled: false,
  autoungrabify: true,
  motionblur: true,
  elements: [],
  style: [{
      selector: 'node',
      style: {
        'width': '30',
        'height': '30',
        'background-color': '#a0a2a5'
      }
    },
    {
      selector: '.transmission_node',
      style: {
        'background-color': '#bc0101',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.3s',
      }
    },
    {
      selector: '.cured_node',
      style: {
        'background-color': '#00ddff',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.3s',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 0.3,
        'curve-style': 'bezier',
        'line-color': '#a0a2a5',
        'target-arrow-color': '#8c8c8c'
      }
    },
    {
      selector: '.transmission_edge',
      style: {
        'line-color': '#bc0101',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.3s',
        'width': '3',
      }
    },
    // nodetree style for nodes/edges //
    {
      selector: '.Neighborhood',
      style: {},
    },
    {
      selector: '.notNeighborhood',
      style: {
        'visibility': 'hidden',
        'line-color': '#a0a2a5',
        'background-color': '#a0a2a5'
      }
    },
  ]
});

// initializing infection chart //
Chart.defaults.global.defaultFontFamily = 'Oxygen';
var ctx = document.getElementById("infectGraph").getContext('2d');
var infectGraph = new Chart(ctx, {});

// initializing cured chart //
var ctx2 = document.getElementById("curedGraph").getContext('2d');
var curedGraph = new Chart(ctx2, {});

/*--------------------------- Function Definitions ---------------------------*/

// Main function //
window.onload = function() {
  contacttransmitGraph();
  cy.on('click', 'node', function() {
    nodeID = this.id();
    nodeTreeView(nodeID);
  });
  playAnimation();
};

// Initializing the graph with both contact and transmission network files //
function contacttransmitGraph() {
  // Reading FAVITES FILE //
  var contactInput = document.getElementById('contactInput');
  var transmissionInput = document.getElementById('transmissionInput');
  // Contact Network file reading and displaying //
  contactInput.addEventListener('change', function(e) {
    var file = contactInput.files[0];
    var textType = /text.*/;
    if (file.type.match(textType)) {
      $('#inputFile1').hide(300);
      var reader = new FileReader();
      reader.onload = function(e) {
        var contactLines = reader.result.split("\n");
        // Iterating and adding each element to cytest graph //
        for (i = 0; i < contactLines.length; i++) {
          var contactArray = contactLines[i].split("\t");
          // ADDING NODES //
          if (contactArray[0] === "NODE") {
            cy.add({
              group: "nodes",
              data: {
                id: contactArray[1]
              }
            });
            if (contactArray[2] == '.') {
              // node has no attributes
              console.log('No Attributes for node: ' + contactArray[1]);
            } else {
              nodeInfo(contactArray[2]);
            }
          }
          // ADDING EDGES //
          else if (contactArray[0] === "EDGE") {
            cy.add({
              group: "edges",
              data: {
                id: contactArray[1] + contactArray[2],
                source: contactArray[1],
                target: contactArray[2]
              }
            });
          }
        }
        // Cytoscape Layout function //
        cy.layout({
          name: 'cose-bilkent',
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
      $('#inputFile2').hide(300);
      var reader = new FileReader();
      reader.onload = function(e) {
        var cureCounter = 0;
        var transmitLines = reader.result.split("\n");
        animDuration = transmitLines.length * 500;
        // iterating and plotting the transmission nodes //
        for (i = 0; i < transmitLines.length; i++) {
          counter = counter + 1;
          var transmitArray = transmitLines[i].split("\t");
          infectLabels.push(Math.ceil(transmitArray[2]));
          infectData.push(counter);
          // checking for empty line or hashtag at the end of file //
          if (transmitArray[0].length == 0) {
            console.log('empty line');
          }
          // checking for initial infected nodes //
          else if (transmitArray[0] === "None") {
            updateTransmitNode('#' + transmitArray[1], 0);
          }
          // checking if nodes are in remmission //
          else if (transmitArray[0] == transmitArray[1]) {
            cureCounter = cureCounter + 1;
            infectData.pop();
            infectLabels.pop();
            curedData.push(cureCounter);
            curedDelay = Math.ceil(transmitArray[2] * 500);
            updatecuredNode('#' + transmitArray[0], curedDelay);
          }
          // checking if edge ID (Node1Node2) exists  //
          else if (cy.$('#' + transmitArray[0] + transmitArray[1]).length) {
            transmissionDelay = Math.ceil(transmitArray[2] * 500);
            updateTransmitEdge('#' + transmitArray[0] + transmitArray[1], transmissionDelay);
            updateTransmitNode('#' + transmitArray[1], transmissionDelay);
          }
          // checking if edge ID (Node2Node1) exists //
          else if (cy.$('#' + transmitArray[1] + transmitArray[0]).length) {
            transmissionDelay = Math.ceil(transmitArray[2] * 500);
            updateTransmitEdge('#' + transmitArray[1] + transmitArray[0], transmissionDelay);
            updateTransmitNode('#' + transmitArray[1], transmissionDelay);
          }
          // error message in case nodes/edges were not defined in the contact network (for developer usage) //
          else {
            console.log('The edge with ID ' + transmitArray[0] + transmitArray[1] + ' or ' + transmitArray[1] + transmitArray[0] + ' does not exist.');
          }
        }
        //checking if transmission is done //
        if (counter >= transmitLines.length) {
          showMainmode = true;
          showIndividualMode = false;
          transmitDone = true;
          playtransmission = true;
          $('#animationBtn').delay(500).show(300);
          hideCharts();
          showMainCharts()
        }
      }
      reader.readAsText(file);
    }
  })
}

/*---------- functions for user manipulation after graph initializes ---------*/

function updateTransmitNode(nodeID, delay) {
  if (nodeID.length) {
    window.setTimeout(function() {
      cy.$(nodeID).classes('transmission_node');
    }, delay);
  }
}

function updateTransmitEdge(edgeID, delay) {
  if (edgeID.length) {
    window.setTimeout(function() {
      cy.$(edgeID).classes('transmission_edge');
    }, delay);
  }
}

function updatecuredNode(nodeID, delay) {
  if (nodeID.length) {
    window.setTimeout(function() {
      cy.$(nodeID).classes('cured_node');
    }, delay);
  }
}

// individual node tree view //
function nodeTreeView(nodeTreeID) {
  if (transmitDone == true) {
    if (nodeSelectMode == false) {
      $('#animationBtn').hide(300);
      nodeSelectMode = true;
      showIndividualMode = true;
      showMainmode = false;
      hideCharts();
      showIndividualCharts();
      nodeTreeElements = cy.$('#' + nodeTreeID).closedNeighborhood();
      notNodeTree = cy.elements().not(nodeTreeElements);
      notNodeTree.toggleClass('notNeighborhood', true);
      nodeTreeElements.toggleClass('Neighborhood', true);
      $('#backbtn').show(300);
      // new layout //
      cy.center(nodeID);
      // Qtip code for each node//
      cy.nodes().qtip({
        content: function() {
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
      //Resetting the graph when back button is pressed //
      backbtn.addEventListener('click', function() {
        $('#animationBtn').show(300);
        notNodeTree.toggleClass('notNeighborhood', false);
        nodeTreeElements.toggleClass('Neighborhood', false);
        showIndividualMode = false;
        nodeSelectMode = false;
        showMainmode = true;
        hideCharts();
        showMainCharts();
        $('#backbtn').hide(300);
      });
    }
  } else {
    alert('Transmission graph has not been uploaded');
  }
}

function nodeInfo(attributes) {
  nodeInfo = attributes.split(',');
  console.log(nodeInfo);
}

function showMainCharts() {
  if (showMainmode == true && showIndividualMode == false) {
    // adding the newly acquired data to show the graph //
    infectGraph = new Chart(ctx, {
      type: 'line',
      data: {
        labels: infectLabels,
        xAxisID: 'Time',
        yAxisID: 'Infected',
        datasets: [{
          label: 'Infected',
          data: infectData,
          borderColor: "#bc0101",
          backgroundColor: "#bc0101",
          fill: true
        }]
      },
      options: {
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: '# Infected'
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time'
            },
            ticks: {
              callback: function(label, index, labels) {
                return label ? label : '';
              }
            }
          }]
        }
      }
    });
    curedGraph = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: infectLabels,
        xAxisID: 'Time',
        yAxisID: 'cured',
        datasets: [{
          label: 'Cured',
          data: curedData,
          borderColor: "#00ddff",
          backgroundColor: "#00ddff",
          fill: true
        }]
      },
      options: {
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: '# Cured'
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time'
            },
            tick: {
              callback: function(label, index, labels) {
                return label ? label : '';
              }
            }
          }]
        }
      }
    });
  }
}

function showIndividualCharts() {
  if (showIndividualMode == true && showMainmode == false) {
    // adding the newly acquired data to show the graph //
    infectGraph = new Chart(ctx, {
      type: 'line',
      data: {
        labels: infectLabels,
        xAxisID: 'Time',
        yAxisID: 'Infected',
        datasets: [{
          label: 'People Infected',
          data: [0, 0, 0, 0, 0, 10],
          borderColor: "#bc0101",
          backgroundColor: "#bc0101",
          fill: true
        }]
      },
      options: {
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: '# Infected'
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time'
            },
            ticks: {
              callback: function(label, index, labels) {
                return label ? label : '';
              }
            }
          }]
        }
      }
    });
    curedGraph = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: infectLabels,
        xAxisID: 'Time',
        yAxisID: 'cured',
        datasets: [{
          label: 'People Cured',
          data: [0, 0, 0, 0, 0, 10],
          borderColor: "#00ddff",
          backgroundColor: "#00ddff",
          fill: true
        }]
      },
      options: {
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: '# Cured'
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time'
            },
            tick: {
              callback: function(label, index, labels) {
                return label ? label : '';
              }
            }
          }]
        }
      }
    });
  }
}

function hideCharts() {
  // changing both graph data to null (to hide) //
  infectGraph = new Chart(ctx, {});
  curedGraph = new Chart(ctx2, {});
}

function playAnimation() {
  var playbutton = $('#animationBtn');
  playbutton.click(function() {
    if (playtransmission == true) {
      $('#animationBtn').toggleClass('playBtn', false);
      $('#animationBtn').toggleClass('animationBtnPause', true);
      playtransmission = false;
    }
    else if (playtransmission == false) {
      $('#animationBtn').toggleClass('animationBtnPause', false);
      $('#animationBtn').toggleClass('playBtn', true);
      playtransmission = true;
    }
  });
}

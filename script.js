/*------------------------------------------------------------------------------
FAVITESViz is a tool for visualizing the output of FAVITES
(FrAmework for VIral Transmission and Evolution Simulation)

FAVITESViz was built mainly using the Cytoscape.js Library, as well as other
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
$('#right').toggleClass('rightcolored', false);
$('#right').toggleClass('rightinitial', true);
$('#menuBtn').hide(0);

// global variables //
var transmissionDelay = 0;
var curedDelay = 0;
var nodeID = null;
var nodeTreeElements = [];
var notNodeTree = [];
var edgeCounter = 0;
var nodeCounter = 0;
var counter = 0;
var playtransmission = false;
var nodeSelectMode = false;
var showIndividualMode = false;
var showMainmode = false;
var transmitDone = false;
var infectData = [];
var infectLabels = [];
var curedData = [];
var targdelay = [];
var animDuration = 0;
var nodeAttributes = null;
var transmitDictionary = {};
var nodeInfoDictionary = {};


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
        'transition-duration': '0.2s',
      }
    },
    {
      selector: '.cured_node',
      style: {
        'background-color': '#00ddff',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.2s',
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
        'transition-duration': '0.2s',
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
  var layoutButton = $('#layoutbutton');
  var playbutton = $('#animationBtn');
  var closebutton = $('#closebutton');
  layoutButton.click(function(){
    if (transmitDone == true){
      $('#layoutModal').fadeIn(300);
    }
  });
  closebutton.click(function(){
    if (transmitDone == true){
      $('#layoutModal').fadeOut(300);
    }
  });
  playbutton.click(function() {
    if (playtransmission == true) {
      playbutton.toggleClass('playBtn', false);
      playbutton.toggleClass('animationBtnPause', true);
      toggleAnimation();
      playtransmission = false;
    } else if (playtransmission == false) {
      playbutton.toggleClass('animationBtnPause', false);
      playbutton.toggleClass('playBtn', true);
      toggleAnimation();
      playtransmission = true;
    }
  });
};

// Initializing the graph with both contact and transmission network files //
function contacttransmitGraph() {
  // Reading FAVITES FILE //
  var contactInput = document.getElementById('contactInput');
  var transmissionInput = document.getElementById('transmissionInput');
  var communitiesInput = document.getElementById('communitiesInput');
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
          nodeAttributes = contactArray[2];
          // ADDING NODES //
          if (contactArray[0] === "NODE") {
            nodeCounter++;
            cy.add({
              group: "nodes",
              data: {
                id: contactArray[1]
              }
            });
            if (contactArray[2] == '.') {
              // node has no attributes
            }
            // getting the node info for infobox //
            else {
              makeInfoDictionary(contactArray[1], nodeAttributes);
            }
          }
          // ADDING EDGES //
          else if (contactArray[0] === "EDGE") {
            edgeCounter++;
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
      $('#right').toggleClass('rightinitial', false);
      $('#right').toggleClass('rightcolored', true);
      var reader = new FileReader();
      reader.onload = function(e) {
        var cureCounter = 0;
        var transmitLines = reader.result.split("\n");
        animDuration = transmitLines.length * 500;
        // iterating and plotting the transmission nodes //
        for (i = 0; i < transmitLines.length; i++) {
          var transmitArray = transmitLines[i].split("\t");
          infectLabels.push(Math.ceil(transmitArray[2]));
          infectData.push(counter);
          targdelay = [];
          targdelay.push(transmitArray[0]);
          targdelay.push(transmitArray[1]);
          targdelay.push(transmitArray[2]);
          counter = counter + 1;
          // checking for empty line or hashtag at the end of file //
          if (transmitArray[0].length == 0) {
            console.log('empty line');
          }
          // checking for initial infected nodes //
          else if (transmitArray[0] === "None") {
            updateTransmitNode('#' + transmitArray[1], 0);
            makeTransmitDictionary(counter, targdelay);
          }
          // checking if nodes is cured//
          else if (transmitArray[0] == transmitArray[1]) {
            cureCounter = cureCounter + 1;
            infectData.pop();
            infectLabels.pop();
            curedData.push(cureCounter);
            curedDelay = Math.ceil(transmitArray[2] * 500);
            updatecuredNode('#' + transmitArray[0], 0);
            makeTransmitDictionary(counter, targdelay);
          }
          // checking if edge ID (Node1Node2) exists  //
          else if (cy.$('#' + transmitArray[0] + transmitArray[1]).length) {
            transmissionDelay = Math.ceil(transmitArray[2] * 500);
            updateTransmitEdge('#' + transmitArray[0] + transmitArray[1], 0);
            updateTransmitNode('#' + transmitArray[1], 0);
            makeTransmitDictionary(counter, targdelay);
          }
          // checking if edge ID (Node2Node1) exists //
          else if (cy.$('#' + transmitArray[1] + transmitArray[0]).length) {
            transmissionDelay = Math.ceil(transmitArray[2] * 500);
            updateTransmitEdge('#' + transmitArray[1] + transmitArray[0], 0);
            updateTransmitNode('#' + transmitArray[1], 0);
            makeTransmitDictionary(counter, targdelay);
          }
          // error message in case nodes/edges were not defined in the contact network (for developer usage) //
          else {
            console.log('The edge with ID ' + transmitArray[0] + transmitArray[1] + ' or ' + transmitArray[1] + transmitArray[0] + ' does not exist.');
            infectData.pop();
            curedData.pop();
          }
        }
        //checking if transmission is done //
        if (counter >= transmitLines.length) {
          showMainmode = true;
          showIndividualMode = false;
          transmitDone = true;
          playtransmission = true;
          $('#animationBtn').delay(500).show(300);
          $('#menuBtn').show(300);
          //getChartInfo();
          showMainInfo();
          hideCharts();
          showMainCharts()
        }
      }
      reader.readAsText(file);
    }
  })
  // community input for partitioning the contact network nodes and edges //
  communitiesInput.addEventListener('change', function(e) {
    var file = communitiesInput.files[0];
    var textType = /text.*/;
    if (file.type.match(textType)) {
      $('#inputFile3').hide(300);
      var reader = new FileReader();
      reader.onload = function(e) {
        var communitiesArray = reader.result;
        // Iterating and adding each element to cytest graph //
        for (i = 0; i < communitiesArray.length; i++) {

        }
      }
      reader.readAsText(file);
    }
  })
}

/*---------- functions for user interaction after graph initializes ---------*/

function makeTransmitDictionary(counter, TSDarray) {
  if (counter && TSDarray) {
    transmitDictionary[counter] = TSDarray;
  }
}

// dictionary that contains each node as a key and attributes as values //
function makeInfoDictionary(nodeID, attributes) {
  if (nodeID && attributes) {
    nodeInfoDictionary[nodeID] = attributes;
  }
}

function showMainInfo() {
  if (edgeCounter && nodeCounter > 0) {
    var h1 = document.getElementById('nodeName');
    var title = document.createTextNode('Network Statistics :');
    h1.appendChild(title);
    var li = document.createElement("LI");
    var li2 = document.createElement("LI");
    var nodes = document.createTextNode("# of Nodes: " + nodeCounter)
    var edges = document.createTextNode("# of Edges: " + edgeCounter)
    li.appendChild(nodes);
    li2.appendChild(edges);
    document.getElementById('attributes').appendChild(li);
    document.getElementById('attributes').appendChild(li2);
  }
}

// displaying node info (attributes) when user clicks on the respective node //
function showNodeInfo(nodeID) {
  if (nodeSelectMode == true) {
    //creating title element that displays node id //
    var h1 = document.getElementById('nodeName');
    var id = document.createTextNode(nodeID + " :");
    h1.appendChild(id);
    // making bulleted list of attributes to be displayed //
    var atr = nodeInfoDictionary[nodeID];
    if (atr) {
      var li = null;
      var info = atr.split(",");
      var bullet = null;
      for (i = 0; i < info.length; i++) {
        li = document.createElement("LI");
        bullet = document.createTextNode(info[i]);
        li.appendChild(bullet);
        document.getElementById('attributes').appendChild(li);
      }
    } else {
      console.log("Node " + nodeID + " does not have any attributes");
    }
  }
}

function hideMainInfo(nodeID) {
  if (showMainmode == false) {
    $('#nodeName').empty(0);
    $('#attributes').empty(0);
  }
}

function hidenodeInfo(nodeID) {
  if (nodeSelectMode == false) {
    $('#nodeName').empty(0);
    $('#attributes').empty(0);
  }
}

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
      hideMainInfo();
      hideCharts();
      showIndividualCharts();
      showNodeInfo(nodeTreeID);
      nodeTreeElements = cy.$('#' + nodeTreeID).closedNeighborhood();
      notNodeTree = cy.elements().not(nodeTreeElements);
      notNodeTree.toggleClass('notNeighborhood', true);
      nodeTreeElements.toggleClass('Neighborhood', true);
      $('#backbtn').show(300);
      // new layout //
      cy.center(nodeTreeID);
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
        hidenodeInfo();
        hideCharts();
        showMainCharts();
        showMainInfo();
        $('#backbtn').hide(300);
      });
    }
  } else {
    alert('Transmission graph has not been uploaded');
  }
}

function getChartInfo() {
  if (transmitDone == true) {
    iter = 0;
    for (var key in transmitDictionary) {
      chartArray = transmitDictionary[key];
      iter++;
    }
  }
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
          backgroundColor: "rgb(188, 1, 1, 0.4)",
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
          backgroundColor: "rgb(0, 221, 255, 0.4)",
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
            ticks: {
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
    Chart.defaults.global.animation.duration = 750;
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
          backgroundColor: "rgb(188, 1, 1, 0.4)",
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
          backgroundColor: "rgb(0, 221, 255, 0.4)",
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
            ticks: {
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
  infectGraph.destroy();
  curedGraph.destroy();
}

function redoNetwork() {
  if (transmitDone == true) {
    cy.$('.transmission_node').removeClass('transmission_node');
    cy.$('.cured_node').removeClass('cured_node');
    cy.$('.transmission_edge').removeClass('transmission_edge');
    cy.$('.cured_edge').removeClass('cured_edge');
  }
}

function toggleAnimation() {
  if (transmitDone == true) {
    if (playtransmission == true) {
      Chart.defaults.global.animation.duration = counter * 750;
    } else if (playtransmission == false) {
      Chart.defaults.global.animation.duration = 500;
    }
    hideCharts();
    showMainCharts();
    redoNetwork();
    for (var key in transmitDictionary) {
      transmitArray = transmitDictionary[key];
      transmissionDelay = Math.ceil(transmitArray[2] * 750);
      // checking for initial infected nodes //
      if (transmitArray[0] === "None") {
        updateTransmitNode('#' + transmitArray[1], 0);
      }
      // checking if nodes are in cured //
      else if (transmitArray[0] == transmitArray[1] && playtransmission == true) {
        updatecuredNode('#' + transmitArray[0], transmissionDelay);
      } else if (transmitArray[0] == transmitArray[1] && playtransmission == false) {
        updatecuredNode('#' + transmitArray[0], 0);
      }
      // checking if edge ID (Node1Node2) exists  //
      else if ((cy.$('#' + transmitArray[0] + transmitArray[1]).length) && playtransmission == true) {
        updateTransmitEdge('#' + transmitArray[0] + transmitArray[1], transmissionDelay);
        updateTransmitNode('#' + transmitArray[1], transmissionDelay);
      } else if ((cy.$('#' + transmitArray[0] + transmitArray[1]).length) && playtransmission == false) {
        updateTransmitEdge('#' + transmitArray[0] + transmitArray[1], 0);
        updateTransmitNode('#' + transmitArray[1], 0);
      }
      // checking if edge ID (Node2Node1) exists //
      else if ((cy.$('#' + transmitArray[1] + transmitArray[0]).length) && playtransmission == true) {
        updateTransmitEdge('#' + transmitArray[1] + transmitArray[0], transmissionDelay);
        updateTransmitNode('#' + transmitArray[1], transmissionDelay);
      } else if ((cy.$('#' + transmitArray[1] + transmitArray[0]).length) && playtransmission == false) {
        updateTransmitEdge('#' + transmitArray[1] + transmitArray[0], 0);
        updateTransmitNode('#' + transmitArray[1], 0);
      }
      // error message in case nodes/edges were not defined in the contact network (for developer usage) //
      else {
        console.log('The edge with ID ' + transmitArray[0] + transmitArray[1] + ' or ' + transmitArray[1] + transmitArray[0] + ' does not exist.');
      }
    }
  }
}

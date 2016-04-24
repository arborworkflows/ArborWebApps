/*******************************************************************************
index.js
*******************************************************************************/

function onLoad() {
  d3.selectAll(".click-zone")
  .on("mouseover", function() {
    d3.select(this).style('background-color', '#555');
  })
  .on("mouseout", function() {
    d3.select(this).style('background-color', '#333');
  });

  d3.select("#back").on("click", function() {
    window.location = "index.html";
  });

  d3.select("#open-vis").on("click", function() {
    sessionStorage.setItem("datatype", "custom");
    window.location = "onset.html";
  });

  dataLoaded(sessionStorage.getItem("data"));
} 

function dataLoaded(d) {
  data = d3.csv.parseRows(d)
  .filter(function(d, i) { 
    return i < 4;
  });

  //show the back and forward buttons
  d3.select("#wrapper").style("height", "800px");
  d3.select("#content").style("height", "700px");
  
  //Create new svg element and populate with the data from the file
  svg = d3.select("#content").append("svg")
  .attr('width', 700)
  .attr('height', 700)
  .style('background-color', '#000')
  .style('margin', 'auto')
  .style('display', 'block');

  var shiftX = 0;
  for(var i = 0; i < 2; i++)
  {
    var shiftY = 0;
    for (var j = 0; j < 2; j++) 
    {
      var c = i * 2 + j;
      var l = data[c].length > 10 ? 10 : data[c].length;

      svg.append("text")
      .attr('class', 'sets')
      .attr('x', shiftX + 25)
      .attr('y', 50 + shiftY)
      .text("⇒");

      svg.append("text")
      .attr('class', 'sets')
      .attr('x', shiftX + 50)
      .attr('y', 50 + shiftY)
      .text(data[c][0]);

      svg.append("text").text("Set")
      .attr('class', 'heading')
      .style('font-size', '20px')
      .attr('x', shiftX + 50 + 14 * data[c][0].length)
      .attr('y', 50 + shiftY);

      svg.append("text").text("Elements")
      .attr('class', 'heading')
      .attr('x', shiftX + 50)
      .attr('y', 80 + shiftY)
      .style('font-size', '16px');

      svg.selectAll("text.elements" + c)
      .data(data[c].filter(function(d, i) { 
        return i > 0 && i < l;
      }))
      .enter()
      .append("text")
      .attr('class', 'elements' + c)
      .attr('x', shiftX + 50)
      .attr('y', function(d, i) {
        return 100 + shiftY + i * 20;
      })
      .text(function(d) {
        return d;
      });

      svg.append("text")
      .attr('class', 'elements' + c)
      .attr('x', shiftX + 50)
      .attr('y', 100 + shiftY + (l - 1) * 20)
      .text("...");

      shiftY = 100 + shiftY + (l - 1) * 20 + 40;
    }

    svg.append("text")
    .attr('class', 'sets')
    .attr('x', shiftX + 25)
    .attr('y', shiftY)
    .text("⇒");

    svg.append("text")
    .attr('class', 'sets')
    .attr('x', shiftX + 50)
    .attr('y', shiftY)
    .text("...");
    
    shiftX = 400;
  }
}


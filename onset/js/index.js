/*******************************************************************************
index.js
*******************************************************************************/

function onLoad() {

  // added for Arbor integration

 d3.selectAll(".arbor-load-zone")
  .on("mouseover", function() {
    d3.select(this).style('background-color', '#555');
  })
  .on("mouseout", function() {
    d3.select(this).style('background-color', '#000');
  });

 d3.select("#arbor-load-container").on("click", function() {
    sessionStorage.setItem("datatype", "template");
    // read the name entered on the dataset selector and turn into a filename
    var filename = '../data/'+document.getElementById('arbor-input-name').value+'.csv';
    sessionStorage.setItem("url", filename);
    window.location = "onset.html";
  });

  // end of Arbor integration

  d3.selectAll(".click-zone")
  .on("mouseover", function() {
    d3.select(this).style('background-color', '#555');
  })
  .on("mouseout", function() {
    d3.select(this).style('background-color', '#333');
  });

  var dropArea = d3.select("body")
  .call(dnd.dropper()
    .on("dragover", function() {
      dropArea.classed("active", true);
      d3.select("#content").style("display", "none");
      d3.select("#drop-feedback").style("display", "block");
    })
    .on("drop", function() {
      dropArea.classed("active", false);
      d3.select("#content").style("display", "block");
      d3.select("#drop-feedback").style("display", "none");
    })
    .on("read", function(files) {
      loadFile(files[0]);
    }));


  d3.select("#whaleshark").on("click", function() {
    sessionStorage.setItem("datatype", "template");
    sessionStorage.setItem("url", "data/aqua/sets.csv");
    window.location = "onset.html";
  });

  d3.select("#senate").on("click", function() {
    sessionStorage.setItem("datatype", "template");
    sessionStorage.setItem("url", "data/senate/sets.csv");
    window.location = "onset.html";
  });

  // d3.select("#calendar").on("click", function() {
  //   sessionStorage.setItem("datatype", "template");
  //   sessionStorage.setItem("url", "data/calendar.csv");
  //   window.location = "onset.html";
  // });

  d3.select("#upload-data").on("click", function() {
    document.getElementById("loadfile").click();
  });

  d3.select("#loadfile").on("change", function() {
    var f = d3.event.target.files[0]; 
    loadFile(f);
  });
} 

function loadFile(f) {
  if (f) {
    var r = new FileReader();
    r.onload = function(e) { 
      contents = e.target.result;
      sessionStorage.setItem("data", contents);
      window.location = "dataview.html"
    }
    r.readAsText(f);
  } else { 
    alert("Failed to load file");
  }
}
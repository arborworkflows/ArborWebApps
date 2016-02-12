matrixCluster = {}


$(document).ready(function() { //run when the whole page is loaded
    matrixCluster.inchlib = new InCHlib({ //instantiate InCHlib
        target: "inchlib", //ID of a target HTML element
        metadata: true, //turn on the metadata 
        column_metadata: true, //turn on the column metadata 
        dendrogram: true,
        max_height: 1200, //set maximum height of visualization in pixels
        width: 1000, //set width of visualization in pixels
        heatmap_colors: "Greens", //set color scale for clustered data
        metadata_colors: "Reds", //set color scale for metadata
    });

    
});

function doit() {
    console.log('doing it')
    matrixCluster.inchlib.read_data_from_file("hierarchy2.json"); //read input json file
    matrixCluster.inchlib.draw(); //draw cluster heatmap
}
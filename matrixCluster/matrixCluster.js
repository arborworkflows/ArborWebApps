matrixCluster = {}


$(document).ready(function() { //run when the whole page is loaded
    window.inchlib = new InCHlib({ //instantiate InCHlib
        target: "dendrogram", //ID of a target HTML element
        metadata: true, //turn on the metadata 
        column_metadata: false, //turn on the column metadata 
        alternative_data: false,
        heatmap_font_color: "rgb(255,255,255)",
        dendrogram: true,
        heatmap_part_width: 0.7,
        count_column: false,
        max_height: 1600, //set maximum height of visualization in pixels
        //width: 1000, //set width of visualization in pixels
        heatmap_colors: "Greens", //set color scale for clustered data
        metadata_colors: "Reds", //set color scale for metadata
    });

$("#dendrogramSwitch").change( function(){
   if( $(this).is(':checked') ) {
        window.inchlib.update_settings({"dendrogram": true})
        window.inchlib.redraw()
    } else {
        window.inchlib.update_settings({"dendrogram": false})
        window.inchlib.redraw()
    }
});

    
});

function doit() {
    console.log('doing it')
    var filename = document.getElementById('filename').value;
    window.inchlib.read_data_from_file(filename); //read input json file
    window.inchlib.draw(); //draw cluster heatmap
}
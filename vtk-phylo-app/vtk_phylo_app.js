var connection = {
    sessionURL: "ws://" + window.location.host + "/ws",
    name: "WebTree",
    description: "Simple VTK Web demo application",
    application: "tree"
},
datacollection= $(".data-collection");
viewport = null;

// Connect to remote server
vtkWeb.connect(connection, function(serverConnection) {
    connection = serverConnection;

    // Create viewport
    viewport = vtkWeb.createViewport({session:connection.session});
    viewport.bind(".viewport-container");

    datacollection.show();

    // Handle window resize
    $(window).resize(function() {
        if(viewport) {
            viewport.render();
        }
    }).trigger('resize');
}, function(code, reason) {
    alert(reason);
});

//populate the data collection list


function updateView() {
    if(viewport) {
        viewport.invalidateScene();
    }
}

// Method call at exit time
function stop() {
    if(false && connection.session) {
        viewport.unbind();
        connection.session.call('vtk:exit');
        connection.session.close();
        connection.session = null;
    }
}

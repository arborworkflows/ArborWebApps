/*globals $, d3, console, window */

var tangelo = {};
tangelo.celery = {};
tangelo.celery.run = function(op, data, done) {
    "use strict";

    d3.json("/service/tasks/celery/" + op)
        .header("Content-Type", "application/json")
        .send("POST", JSON.stringify(data), function(error, job) {
            function checkStatus() {
                d3.json("/service/tasks/celery/" + job.id + "/status", function (error, status) {
                    if (error) {
                        done(error);
                    } else if (status.status === "PENDING") {
                        window.setTimeout(checkStatus, 500);
                    } else if (status.status === "SUCCESS") {
                        d3.json("/service/tasks/celery/" + job.id + "/result", function (error, result) {
                            if (error) {
                                done(error);
                            } else {
                                done(undefined, result);
                            }
                        });
                    } else {
                        done("Job failed.");
                    }
                });
            }
            window.setTimeout(checkStatus, 500);
        });
};

(function () {
    "use strict";

    d3.select("#run").on("click", function () {
        tangelo.celery.run("add", [10, 20], function (error, data) {
            console.log(data);
        });
    });
}());

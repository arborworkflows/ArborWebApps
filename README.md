# Arbor Workflows web application suite

This repository contains a set of visual web interfaces built
for the [Arbor Workflows](http://arborworkflows.com) project.

These apps were built using the [Tangelo](http://tangelo.kitware.com)
framework, which may be installed by following
[these instructions](http://github.com/Kitware/tangelo/wiki/Installation).
To use these web applications, install and start Tangelo, then
open a command shell and execute the following:

    ln -s /path/to/ArborWebApps WEBROOT/arbor

`WEBROOT` is the Tangelo web root seen by `tangelo status`.

You should then be able to visit the web apps on your Tangelo instance, e.g.
[http://localhost:8080/arbor/](http://localhost:8080/arbor/).
Alternately, you can clone the repository
directly in the `deploy/web` directory or your home directory and visit it
at [http://localhost:8080/ArborWebApps/](http://localhost:8080/ArborWebApps/)
or [http://localhost:8080/~username/ArborWebApps/](http://localhost:8080/~username/ArborWebApps/).

These applications require that you have a running
[MongoDB](http://www.mongodb.org) instance and have installed
[pymongo](http://api.mongodb.org/python/current/) in your Python environment.
Use the Arbor
[ProjectManager](https://github.com/arborworkflows/ProjectManager)
to load phylogenetic trees into MongoDB.

Some of the apps require ProjectManager REST API. To mount that, link it to Tangelo
with the following command:

    ln -s /path/to/ProjectManager/tangelo WEBROOT/arborapi

Again, `WEBROOT` is the Tangelo web root seen by `tangelo status`.

# Get Involved

Fork our repository, do great things, and send us merge requests.
We're happy to investigate incorporating your new ideas. Use our
[issue tracker](https://github.com/arborworkflows/ArborWebApps/issues)
to submit bug and feature requests.

# Acknowledgement

Arbor Workflows development is sponsored by the NSF.

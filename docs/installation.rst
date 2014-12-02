====================
    Installation
====================

TangeloHub Installation
-----------------------

Arbor Workflows uses `TangeloHub <http://www.tangelohub.org/tangelohub/>`_ as its main interface.
Follow the `TangeloHub Vagrant install instructions <http://tangelohub.readthedocs.org/en/latest/installation.html#vagrant-install>`_
with the Ansible ``arbor`` setting set to ``true`` (the default) to spin up your own instance.

Easy Mode App Installation
--------------------------

The easy mode applications must be added through an additional repository checkout and a few symbolic links.
To set up these links, first enter your Vagrant VM with: ::

    vagrant ssh

Once inside your virtual machine, checkout the ArborWebApps repository to the ``/vagrant`` directory,
which will be exposed on your host machine. ::

    cd /vagrant
    git clone https://github.com/arborworkflows/ArborWebApps.git
    ln -s ArborWebApps/phylogenetic-signal app/phylogenetic-signal
    ln -s ArborWebApps/ancestral-state app/ancestral-state

Now you will also need to import the "Phylogenetic signal" and "Ancestral state" analyses from
the public Arbor at `https://arbor.kitware.com <https://arbor.kitware.com>`_ by selecting the analysis
and clicking Download, then uploading them on your instance with the Upload button.

A final step is to update your Easy Mode apps to point to your own analysis IDs. This is done by
replacing lines that look like the following in the Easy Mode ``js/main.js``: ::

    app.ASRId = "53cfdc9b358ebfb5e9bae080";

to contain the analysis IDs from your application. You can find these by visiting your Girder at
`http://localhost:9080/girder <http://localhost:9080/girder>`_ and navigating to the analysis. The
analysis ID will appear in the page URL.

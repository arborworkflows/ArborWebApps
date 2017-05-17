====================
    Installation
====================

Flow Installation
-----------------

Arbor Workflows uses `Flow <https://github.com/Kitware/flow/>`_, developed by Kitware, as its main interface.
Follow the `Flow Vagrant install instructions <http://resonant-flow.readthedocs.org/en/latest/installation.html#vagrant-install>`_
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
    cd app
    ln -s ../ArborWebApps/phylogenetic-signal .
    ln -s ../ArborWebApps/ancestral-state  .

Now you will also need to import the "Phylogenetic signal" and "Ancestral state" analyses from
the public Arbor at `http://arborclassic.arborworkflows.com <http://arborclassic.arborworkflows.com:9080>`_ by selecting the analysis
and clicking Download, then uploading them on your instance with the Upload button.

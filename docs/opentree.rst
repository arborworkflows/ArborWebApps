============================
    OpenTree Integration
============================

Arbor contains a set of analyses designed to provide connectivity to the Open Tree of Life (opentreeoflife.org).
These analyses provide taxonomy lookup and subtree access services.
The goal is to provide techniques for users to access open tree data without having
to explicitly program using the OpenTree API calls.
Instead, the API calls are embedded inside Arbor workflow steps. 

These operations are currently in prototype form and should be tested and adjusted as the
OpenTree API and Arbor's functionality continue to evolve. 

Taxonomy Analyses
-----------------

Explore OpenTree species name completion
^^^^
This analysis lets users provide a
comma-separated list of partial names (name prefixes) that will be used to query the OpenTree taxonomy.
A table is returned that provides all the values returned as attempts to complete the queries partial names.
This uses the "autocomplete" function of OpenTree's API. 

Verbose OpenTree TNRS return for names
^^^^
This analysis is written to allow for exploring
the OpenTree TNRS data return.  It uses the OpenTree v2 API "match_names" interface.
A single column table, or a table with the names in the first column, is expected.
All names are extracted from the table and a single query of the name list is performed.
A table is built containing the full taxonomy lookup results. 

Lookup names using OpenTree auto completion
^^^^
This operation assumes a single column table,
or a table where the first column is the species of a matrix.
Each name in the column is used to query the OpenTree "autocomplete" API function in order to
determine a matching node in the Tree of Life.
Currently, only the first taxonomic return is examined and used if it is indicated
as a taxon (or leaf node) in the tree.
Therefore, this analysis can be used to identify OpenTree taxa that correspond to a user's character matrix. 

Lookup names using OpenTree Taxonomy
^^^^
This operation is similar to the
"Lookup with auto completion" described above, except this operation uses
OpenTree's v2 "match_names" API call.
The match_names API call does not currently delineate between taxa and non-taxa,
so an attempt has been made, at the Arbor level, to filter returns for only
taxa by examining the attributes returned by OpenTree.
This methodology should be reviewed before extensive use. 

Tree Operations
---------------

Return the OpenTree subtree from a node list
^^^^
Given a list of OpenTree
node IDs (OttIds), return a tree that contains these taxa, and only these taxa.
This analysis calls OpenTree's SubtreeForNodes API endpoint.
The output of this function is the returned tree in Newick format.

========================
    Table Operations
========================

Arbor is designed to make it easier to perform comparative analysis on
tabular and tree datasets without the need for custom programming.
Users of Arbor are able to invoke operations on their datasets one at a time,
or collect operations into a workflow to be executed by Arbor.
The following is a list of table operations currently available in Arbor.
Additional operations will be added as the Arbor system continues to develop. 

Row Operations
--------------

Append Rows
^^^^
This merges two tables which have the same column headers, but different content rows.
The analysis should look for all headers in either input file and output the union of
the individual column header fields.
If values are sparse (missing some columns in some rows), let it be sparse initially.
This can be used to "merge" tables together, when the attribute columns match. 

Select Random Rows
^^^^
Select a random subset of the input rows to pass through.
Input is a table and an integer value indicating how many rows are desired in the output table.
The algorithm selects output rows randomly from the entire length of the input table.
This can be used to generate samples out of a large trait matrix, to test a workflow
with a smaller matching tree, for example.

Drop Rows by Value
^^^^
Pass all rows of an input table through the analysis unless a particular test criteria is met.
If the test is met, this row will be "dropped" from the output table.
The criteria is specified by specifying a column header name and a comma separated
list of values to look for.  For example, drop a row from a character matrix, where the
"species" entry is "anolis occultus".  This will drop the species from the matrix but pass the
other species values through. 

Aggregate table by average
^^^^
A table algorithm that inputs a table and a column name to use as a "class" identifier.
It is assumed that the class column will have a finite number of categorical values,
even if they are numerical in nature.  The algorithm will generate a table output with only
one row per class value.  All the attribute values for each individual row from a particular
class will be aggregated. To illustrate, consider an example with a table containing 100
observations across a number of islands.  An "Island" column is included, where rows
have the the value "Cuba", "Puerto Rico", or "Hispaniola" -- representing three "classes" of
observations.  If aggregated by "Island", the output table will have three rows and all the
continuous attributes in the output table will be the average of all rows that contributed to
each corresponding class.  This is sometimes called a "Group By" operation. 

Aggregate table by max
^^^^
This is the same operation as "aggregate table by max", except the maximum value observed
for each class is returned instead of the average value of all class members. 

Column Operations
-----------------

Append Columns
^^^^
This analysis appends columns of two datasets together.  One "index" column is named and
this column is used as the primary key to bring together all column entries from each
table together into a single row record.  For example, lets say we have a 1st table indexed
by a scientific name with 3 attribute columns and a 2nd table indexed by the same scientific
name, with 2 additional attribute columns (lets call them attribute 4 & 5).
This analysis will output a five column table, where the index column (scientific name)
has been used to correctly merge attributes for each corresponding row together. 
 
Extract Columns
^^^^
Accept an input table and a list of column header names.
Only the columns contained in the header list are passed through to the output.
Therefore, this is a way of keeping only the most important columns in a table instance.
The column selection input is organized as a single-column table, because it will be easy
to read as a table, also. 

Extract Columns by string
^^^^
The same algorithm as above, but the user can enter a list of columns to extract as a
comma separated list when the algorithm is run. This is useful for interactively working
with a table a step at a time. 

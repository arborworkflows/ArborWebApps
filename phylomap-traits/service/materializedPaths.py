#phylotree to
#materialized paths
#many algorithms from http://www.codeproject.com/Articles/522746/Storing-Tree-like-Hierarchy-Structures-With-MongoD

import MongoTree

class materializedPaths(MongoTree.MongoTree):
	'''Class for operations on materialized path tree hierachy structures'''

	def insert(self, locationID, dataID):
		'''insert element into tree with parent locationID, element links to dataID'''

		try:
			dataID = self.toObjectId(dataID)
			locationID = self.toObjectId(locationID)
		except:
			raise

		# inserting the root
		if locationID == None or locationID == '':
			return self.skel.insert({'path':',', 'dataLink':dataID})

		# get the ancestor list of parent and append new parent to it
		ancestorpath = self.skel.find_one({'_id':locationID})['path']
		if ancestorpath != None:
			ancestorpath += str(locationID) + ","
			return self.skel.insert({'path':ancestorpath, 'dataLink':dataID})
		else:
			# didn't find the parent
			return -1

	def getChildren(self, nodeID):
		'''get all the children of a node, unordered'''
		children = []
		child = self.skel.find({'path':{'$regex':str(nodeID) + ',$', '$options':'i'}}, {'_id':1})
		for c in child:
			children.append(str(c['_id']))
		return children

	def getParent(self, nodeID):
		'''get the parent of a node, returned as a string'''
		nodeID = self.toObjectId(nodeID)
		if nodeID < 0:
			return -1
		parent = self.skel.find_one({'_id':nodeID},{'_id':0,'path':1})
		#convert string to array then return the last element (the parent)
		return str(parent['path'].strip(',').split(',')[-1])

	def getDescendants(self, nodeID):
		'''get all the descendants of a node, returns a list of string ids, each id is a descendant'''
		criteria = dict()
		nodeID = self.toObjectId(nodeID)
		if nodeID < 0:
			return -1
		descendants = []

		item = self.skel.find_one({'_id':nodeID},{'path':1})
		criteria['path'] = {'$regex':'^' + item['path'] + str(item['_id']) + ',', '$options':'i'}
		# this takes advantage of the index, much faster
		children = self.skel.find(criteria,{'_id':1})

		# output in list form
		for child in children:
			descendants.append(str(child['_id']))
		return descendants

	def getDescendantsCriteria(self, nodeID, keyCriteria=None, outputCriteria=None):
		'''get all descendants but with criteria, returns the mongo object'''
		criteria = dict()
		output = dict()
		print nodeID
		nodeID = self.toObjectId(nodeID)
		if nodeID < 0:
			return -1
		item = self.skel.find_one({'_id':nodeID},{'path':1})
		if self.skel_coll == self.data_coll:
			#format keyCriteria into a dictionary
			if isinstance(keyCriteria, basestring):
				criteria[keyCriteria] = {'$exists':1}
			elif isinstance(keyCriteria, list):
				try:
					criteria = {crit:{'$exists':1} for crit in keyCriteria}
				except TypeError as e:
					print "Nonstring type: " + type(e)
					raise
			#format outputCriteria into a dictionary
			if isinstance(outputCriteria, basestring):
				output[outputCriteria] = 1
			elif isinstance(outputCriteria, list):
				try:
					output = {crit:1 for crit in outputCriteria}
				except TypeError as e:
					print "Nonstring type: " + type(e)
					raise

		criteria['path'] = {'$regex':'^' + item['path'] + str(item['_id']) + ',', '$options':'i'}
		if output:
			return self.skel.find(criteria, output)
		else:
			return self.skel.find(criteria)

	def getPathToNode(self, nodeID):
		'''get the entire path from nodeID to the node of the tree, return a list of string ids'''
		nodeID = self.toObjectId(nodeID)
		if nodeID < 0:
			return -1
		path = []
		item = self.skel.find_one({'_id':nodeID})
		if item is None:
			return -2
		#split the string list into a python list to return
		return str(item['path']).strip(',').split(',')

	def ensureIndexes(self, coll=None, indexes='path'):
		'''ensure skel is indexed on path'''
		if coll is None:
			coll = self.skel_coll
		self.db[coll].ensure_index(indexes)

	# a very non-scientific way to check if materlialized paths are present
	def checkIfPresent(self):
		if self.skel.count() == 0:
			return False
		if 'pathc' not in self.skel.find_one():
			return False
		return True

	def generateFromChildTree(self,ChildTree=None,childLabel='clades',rooted=True,rootID=None):
		'''Create a materializedpath tree strucutre from a childtree. skeltree must be empty.'''
		def MPHelper(pathString, node):
			# if we're adding to existing data
			if self.skel_coll == self.data_coll:
				self.skel.update({'_id':node['_id']}, {'$set': {'path':pathString}})
				insertedID = node['_id']
			else:
				insertedID = self.skel.insert({'path':pathString, 'dataLink':node['_id']})
			pathString += str(insertedID) + ','
			#if the node has any children, insert all those children
			if childLabel in node:
				for child in node[childLabel]:
					childNode = self.data.find_one({'_id':child},{childLabel:1})
					MPHelper(pathString, childNode)

		if ChildTree is not None:
			self.data_coll = ChildTree
			try:
				self.data = pymongo.Connection(self.servername)[self.dbname][self.data_coll]
			except pymongo.errors.AutoReconnect:
				raise

		# if skel_col != data_coll
		# collection must be empty to generate tree
		if self.skel_coll != self.data_coll and self.skel.count() != 0:
			return -1

		if rooted == False:
			#get the root from the rootID
			root = self.data.find_one({'_id':self.toObjectId(rootID)},{childLabel:1})
		else:
			root = self.data.find_one({'rooted':True},{childLabel:1})
		if root is None:
			# found no root
			raise KeyError()
		MPHelper(',', root)

# For testing only
if __name__ == "__main__":
	a = materializedPaths("localhost", "xdata", "anolis", "anolis")
	print "loc test"
	print a.getDescendantsCriteria("511a95d9df790d08f000018c", "loc")[0]
	print "non loc test"
	print len(a.getDescendants("511a95d9df790d08f000018c"))
	print a.checkIfPresent()

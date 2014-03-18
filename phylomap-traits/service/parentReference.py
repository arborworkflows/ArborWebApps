import MongoTree

class parentReference(MongoTree.MongoTree):
	'''Class for operations on materialized path tree hierachy structures'''

	def insert(self, locationID, dataID):
		'''insert element into tree with parent locationID, element links to dataID'''

		try:
			dataID = self.toObjectId(dataID)
			locationID = self.toObjectId(locationID)
		except:
			raise

		return self.skel.insert({'parent':locationID, 'dataLink':dataID})

	def delete(self, nodeID):
		'''remove a node from the skeleton tree, leave in the dataID tree'''
		try:	
			self.skel.remove({'_id':self.toObjectId(nodeID)})
		except:
			raise

	def getChildren(self, nodeID):
		'''get all the children of a node, returned as a list of strings'''
		children = []
		try:
			child = self.skel.find({'parent':self.toObjectId(nodeID)},{'_id':1})
		except:
			raise

		for c in child:
			children.append(str(c['_id']))
		return children

	def getParent(self, nodeID):
		'''get the parent of a node, returned as a string'''
		try:
			parent = self.skel.find_one({'_id':self.toObjectId(nodeID)},{'_id':0,'parent':1})
		except:
			raise
		#convert string to array then return the last element (the parent)
		return str(parent['parent'])

	def getDescendants(self, nodeID):
		'''get all the descendants of a node, returns a list of string ids, each id is a descendant'''
		descendants = []
		stack = []

		try:
			#recursively find all descendants of from nodeID
			item = self.skel.find_one({'_id':self.toObjectId(nodeID)},{'_id':1})
			stack.append(item)
			while (stack.length > 0):
				currentNode = stack.pop()
				children = self.skel.find({'parent':currentNode['_id']},{'_id':1})
				for c in children:
					descendants.append(str(c['_id']))
					stack.append(c['_id'])
		except:
			raise

		return descendants

	def getPathToNode(self, nodeID):
		'''get the entire path from nodeID to the node of the tree, return a list of string ids'''
		path = []
		try:
			item = self.skel.find_one({'_id':self.toObjectId(nodeID)},{'parent':1})
			# loop until we find the root node
			while (item['parent'] != '' and item['parent'] != None):
				item = self.skel.find_one({'_id':item['parent']})
				path.append(str(item['_id']))
		except:
			raise

		return path.reverse()

	def ensureIndexes(self, coll=None, indexes='parent'):
		'''ensure skel is indexed on path'''
		if coll is None:
			coll = self.skel_coll
		self.db[coll].ensure_index(indexes)


	def generateFromChildTree(self,ChildTree=None,childLabel='clades',rooted=True,rootID=None):
		'''Create a parent tree strucutre from a childtree. skeltree must be empty.'''
		def recursiveHelper(parent, node):
			if childLabel in node:
				for child in node[childLabel]:
					childID = self.skel.insert({'parent':parent, 'dataLink':child})
					childNode = self.data.find_one({'_id':child},{childLabel:1})
					recursiveHelper(childID, childNode)

		# collection must be empty to generate tree
		if self.skel.count() != 0:
			raise IndexError()
		if ChildTree is not None:
			self.data_coll = ChildTree
			try:
				self.data = pymongo.Connection(self.servername)[self.dbname][self.data_coll]
			except pymongo.errors.AutoReconnect:
				raise
		if rooted == False:
			#get the root from the rootID
			root = self.data.find_one({'_id':self.toObjectId(rootID)},{childLabel:1})
		else:
			root = self.data.find_one({'rooted':True},{childLabel:1})
		if root is None:
			# found no root
			raise KeyError()
		rootID = self.skel.insert({'parent':None, 'dataLink':root['_id']})
		recursiveHelper(rootID, root)
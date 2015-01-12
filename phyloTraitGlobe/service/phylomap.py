
import json
import tangelo
import math
import materializedPaths
import urllib2

def isInBounds(lng, lat, container, boundary_type, resp):
	'''Function performs a manual bounds check to ensure that (lng,lat) is in
	bounding box contained in container'''
	try:
		if boundary_type == 'circle':
			# spherical
			KPiDouble = 3.141592654
			KDegreesToRadiansDouble = 0.01745329 #KPiDouble / 180.0
			clng = container[0][0] * KDegreesToRadiansDouble
			clat = container[0][1] * KDegreesToRadiansDouble
			cradius = container[1]

			lng *= KDegreesToRadiansDouble
			lat *= KDegreesToRadiansDouble
			angle = math.acos(math.sin(clat) * math.sin(lat) + math.cos(clat) * math.cos(lat) * math.cos(lng - clng))
			return (angle < cradius)
		elif boundary_type == 'rect':
			cswlng = container[0][0];
			cswlat = container[0][1];
			cnelng = container[1][0];
			cnelat = container[1][1];
			if lng <= cnelng and lng >= cswlng and lat <= cnelat and lat >= cswlat:
				return True
			else:
				return False
		else:
			resp['error'] = "Invalid geometry type: %s" % (boundary_type)
			raise
	except ValueError as e:
		resp['error'] = e.message
		raise

# The interface of the original phylomap service was designed to work directly against a mongo database.
# However, we are now dynamically changing collections, so the mongo database info (dbname & data_coll isn't directly available,
# but is looked up through the Arbor API on the fly.

def run(servername, projectname, datasetname, boundary_type, _id=None, lng=-1.0, lat=-1.0, radius=0.0, swlng=-1.0, swlat=-1.0, nelng=-1.0, nelat=-1.0, limit=1000, _filter='true'):
        url = 'http://'+servername+':8080'+'/arborapi/projmgr/collection/'+projectname+'/PhyloTree/'+datasetname
        print url
        response = urllib2.urlopen(url)
        html = response.read()
        dataDescription = json.loads(html)
        result = run_on_collection(dataDescription['host'],dataDescription['db'],dataDescription[ 'collection'],
                     boundary_type, _id, lng, lat, radius, swlng, swlat, nelng, nelat, limit, _filter)
        return result


# this is the interface of the original phylomap service, which is designed to work directly against the mongo database.
def run_on_collection(servername, dbname, data_coll, boundary_type, _id=None, lng=-1.0, lat=-1.0, radius=0.0, swlng=-1.0, swlat=-1.0, nelng=-1.0, nelat=-1.0, limit=1000, _filter='true'):
	earthRadius = 6378137 #meters
	# Construct an empty response object.
	response = tangelo.empty_response();
	try:
		limit = int(limit)
	except ValueError:
		response['error'] = "Argument (%s), value (%s) could not be converted to int" % ('limit', limit)
	if limit > 1000 or limit < 1:
		limit = 1000

	if boundary_type == 'circle':
		# convert types to floats
		try:
			lng = float(lng)
			lat = float(lat)
			radius = float(radius)
		except ValueError as e:
			response['error'] = e.message + " Argument could not be converted to float."
			return  bson.json_util.dumps(response)
		#check bounds
		if lng > 180.0 or lng < -180.0:
			response['error'] = "Longitude out of bounds: %s" % (lng)
			return bson.json_util.dumps(response)
		if lat > 90.0 or lat < -90.0:
			response['error'] = "Latitude out of bounds: %s" % (lat)
			return bson.json_util.dumps(response)
		if radius < 0.0:
			response['error'] = "Radius cannot be negative: %s" % (radius)
			return bson.json_util.dumps(response)
		# convert radius from meters to percentage of earth
		radius = radius / earthRadius
		container = [[lng, lat], radius]
		query = {'loc' : {'$within' : { '$centerSphere' : container }}}
	elif boundary_type == 'rect':
		try:
			swlng = float(swlng)
			swlat = float(swlat)
			nelng = float(nelng)
			nelat = float(nelat)
		except ValueError as e:
			response['error'] = e.message + " Argument could not be converted to float."
			return bson.json_util.dumps(response)
		container = [[swlng, swlat], [nelng, nelat]]
		query = {'loc' : {'$within' : { '$box' : container }}}
	elif boundary_type == 'id':
		True
	else:
		response['error'] = "Invalid geometery type: %s" % (boundary_type)
		return bson.json_util.dumps(response)

	# Create database connection.
	try:
		c = pymongo.Connection(servername)[dbname][data_coll]
	except pymongo.errors.AutoReconnect:
		response['error'] = "Could not connect to MongoDB server '%s'" % (servername)
		return bson.json_util.dumps(response)

	# Perform the query
	if boundary_type == 'id':
		mpath = materializedPaths.materializedPaths(servername,dbname,data_coll,data_coll)
		if mpath.checkIfPresent():
			it = mpath.getDescendantsCriteria(_id, "loc")
		else:
			# materialized paths not present, create it!
			mpath.generateFromChildTree()
			it = mpath.getDescendantsCriteria(_id, "loc")
			#response['error'] = "Materialized Paths not present in dataset"
			#return bson.json_util.dumps(response)
	else:
		it = c.find(spec=query, limit=limit)
	#response['error'] = "we made it here" + " " + str(_id) + " " + str(it.count())
	#return bson.json_util.dumps(response)
	# Create a list of the results
	results = list()
	# if we want to filter by only those locations of items in our range
	if _filter == 'true':
		count = 0
		try:
			for item in it:
				# for each location of the item
				for location in item['loc']:
					# if it's in bounds create new object, add to results
					if boundary_type == 'id' or isInBounds(float(location[0]), float(location[1]), container, boundary_type, response):
						marker = dict()
						marker['name'] = item['taxonomies'][0]['scientific_name']
						marker['ID'] = item['_id']
						marker['lng'] = location[0]
						marker['lat'] = location[1]
						results.append(marker)
						count += 1
					# else: don't add point
		except ValueError:
			return bson.json_util.dumps(response)
		except KeyError:
			return bson.json_util.dumps(response)
	# otherwise return document containing all locations of item in range
	else:
		results = [x for x in it]

	# Create an object to structure the results
	retobj = dict()
	retobj['count'] = count if _filter == 'true' else it.count()
	retobj['data'] = results

	# Pack the results in the response object, and return it
	response['result'] = retobj
	return bson.json_util.dumps(response)

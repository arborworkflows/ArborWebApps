Arbor Sawmill
=============

Arbor Sawmill is a tiny application to show how to use remote computation through the Tangelo Celery web service.

Start a Celery worker:
* `pip install celery`
* `cd <arborwebapps_path>/sawmill`
* `celery -A add worker`

Make webapp accessible to Tangelo:
* `ln -s <arborwebapps_path> <tangelo_path>/arborwebapps`
* `tangelo start` (if needed)

Now visit [http://localhost:8080/arborwebapps/sawmill/](http://localhost:8080/arborwebapps/sawmill/) to view the app.
Pressing *Run* should produce the output `{"result": 30}`.

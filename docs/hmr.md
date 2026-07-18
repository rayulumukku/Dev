# Hot Module Replacement (HMR)

Ray utilizes a custom Hot Module Replacement engine for instant page updates.

* Files are watched for changes.
* Changed modules trigger graph invalidation.
* Update planner traverses the graph to find accepting boundaries.
* Playloads containing updated code are pushed to active clients via WebSockets.

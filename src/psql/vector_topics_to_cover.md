m (max_connections):

Default: 16

Higher values improve recall but increase index size and build time

Typical range: 10-100

ef_construction:

Default: 64

Controls the quality of the graph during construction

Higher values improve recall but increase build time

Typical range: 50-400

ef_search:

Runtime parameter (not part of index creation)

Controls the number of candidates considered during search

Higher values improve recall but slow down queries

Can be set per query with SET hnsw.ef_search = value

# Import data
```
# genrate insert queries
python scripts/enronannotation2neo4j.py > tmp

# insert into neo4j
neo4j-shell -file tmp

# in case of an error:
sudo systemctl stop neo4j.service
sudo rm -r /var/lib/neo4j/data/databases/graph.db
sudo systemctl start neo4j.service
# fix script and repeat from top :)
```

# Some queries

View the web of denotations and their relations for some emails (skip&limit)
```
MATCH p=(a:Mail)<-[:part_of]-(hb)<-[*0..]-(parts)
WHERE hb:Header OR hb:Body
RETURN a, collect(p)
SKIP 4
LIMIT 2
```

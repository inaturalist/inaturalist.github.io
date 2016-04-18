# inaturalist.github.io
iNat gh-pages repo, mostly for fun.

# Attribution

* the animated map uses https://github.com/CartoDB/torque

# Weekly Counts
Data was exported using the following:

```BASH
psql inaturalist_production -c "COPY (
SELECT date_trunc('week', observations.created_at) AS raw_date, to_char(date_trunc('week', observations.created_at), 'DD-Mon-YY') AS date, most(users.login) AS most_login, most(user_id) AS most_user, count(*) AS count, rank() OVER (ORDER BY count(*) DESC) AS rank
    FROM observations
    JOIN users ON (observations.user_id = users.id)
    WHERE quality_grade IN ('research','needs_id')
    GROUP BY 1
    ORDER BY 1
) TO STDOUT WITH CSV HEADER" > weekly_counts.csv
```

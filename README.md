# inaturalist.github.io
iNat gh-pages repo, mostly for fun.

# Attribution

* the animated map uses https://github.com/CartoDB/torque

# Weekly Counts
Data was exported using the following:

```BASH
psql inaturalist_production -c "COPY (
SELECT date_trunc('week', observations.created_at) AS raw_date, to_char(date_trunc('week', observations.created_at), 'DD-Mon-YY') AS date, most(users.icon_content_type) AS most_filetype, most(users.login) AS most_login, most(user_id) AS most_user, count(*) AS count, rank() OVER (ORDER BY count(*) DESC) AS rank
    FROM observations
    JOIN users ON (observations.user_id = users.id)
    WHERE quality_grade IN ('research','needs_id')
    GROUP BY 1
    ORDER BY 1
) TO STDOUT WITH CSV HEADER" > weekly_counts.csv
```

After adding this aggregate function:

```SQL
    CREATE OR REPLACE FUNCTION _final_most(anyarray)
      RETURNS anyelement AS
    $BODY$
        SELECT a
        FROM unnest($1) a
        GROUP BY 1 ORDER BY COUNT(1) DESC
        LIMIT 1;
    $BODY$
      LANGUAGE 'sql' IMMUTABLE;
    
    CREATE AGGREGATE most(anyelement) (
      SFUNC=array_append,
      STYPE=anyarray,
      FINALFUNC=_final_most,
      INITCOND='{}'
    );
```

# Country Stats
Data was exported using the following (boundary data from GADM)
```ruby
#Generate data #replace 54505 for antarctica with 58750
country_key = [{place_id: 7341, iso: "AFG"},{place_id: 96774, iso: "XAD"},{place_id: 10282, iso: "ALA"},{place_id: 8505, iso: "ALB"},{place_id: 7300, iso: "DZA"},{place_id: 8548, iso: "ASM"},{place_id: 8226, iso: "AND"},{place_id: 7100, iso: "AGO"},{place_id: 10281, iso: "AIA"},{place_id: 58750, iso: "ATA"},{place_id: 10283, iso: "ATG"},{place_id: 7190, iso: "ARG"},{place_id: 8433, iso: "ARM"},{place_id: 8359, iso: "ABW"},{place_id: 6744, iso: "AUS"},{place_id: 8057, iso: "AUT"},{place_id: 8434, iso: "AZE"},{place_id: 7313, iso: "BHS"},{place_id: 10284, iso: "BHR"},{place_id: 7154, iso: "BGD"},{place_id: 10285, iso: "BRB"},{place_id: 7578, iso: "BLR"},{place_id: 7008, iso: "BEL"},{place_id: 6953, iso: "BLZ"},{place_id: 8509, iso: "BEN"},{place_id: 8638, iso: "BMU"},{place_id: 7707, iso: "BTN"},{place_id: 6783, iso: "BOL"},{place_id: 8360, iso: "BES"},{place_id: 8268, iso: "BIH"},{place_id: 7105, iso: "BWA"},{place_id: 10286, iso: "BVT"},{place_id: 6878, iso: "BRA"},{place_id: 10295, iso: "IOT"},{place_id: 10318, iso: "VGB"},{place_id: 7838, iso: "BRN"},{place_id: 8241, iso: "BGR"},{place_id: 8510, iso: "BFA"},{place_id: 7106, iso: "BDI"},{place_id: 7002, iso: "KHM"},{place_id: 7546, iso: "CMR"},{place_id: 6712, iso: "CAN"},{place_id: 9445, iso: "CPV"},{place_id: 7488, iso: "CYM"},{place_id: 8356, iso: "CAF"},{place_id: 7074, iso: "TCD"},{place_id: 7182, iso: "CHL"},{place_id: 6903, iso: "CHN"},{place_id: 7616, iso: "CXR"},{place_id: 10320, iso: "XCL"},{place_id: 10287, iso: "CCK"},{place_id: 7196, iso: "COL"},{place_id: 8421, iso: "COM"},{place_id: 10288, iso: "COK"},{place_id: 6924, iso: "CRI"},{place_id: 8004, iso: "CIV"},{place_id: 8196, iso: "HRV"},{place_id: 6944, iso: "CUB"},{place_id: 10408, iso: "CUW"},{place_id: 10289, iso: "CYP"},{place_id: 8264, iso: "CZE"},{place_id: 7054, iso: "COD"},{place_id: 8051, iso: "DNK"},{place_id: 8511, iso: "DJI"},{place_id: 9184, iso: "DMA"},{place_id: 6931, iso: "DOM"},{place_id: 10314, iso: "TLS"},{place_id: 7512, iso: "ECU"},{place_id: 7055, iso: "EGY"},{place_id: 7563, iso: "SLV"},{place_id: 9240, iso: "GNQ"},{place_id: 8208, iso: "ERI"},{place_id: 8265, iso: "EST"},{place_id: 6846, iso: "ETH"},{place_id: 7690, iso: "FLK"},{place_id: 10290, iso: "FRO"},{place_id: 7332, iso: "FJI"},{place_id: 7020, iso: "FIN"},{place_id: 6753, iso: "FRA"},{place_id: 6949, iso: "GUF"},{place_id: 6748, iso: "PYF"},{place_id: 9319, iso: "ATF"},{place_id: 7112, iso: "GAB"},{place_id: 7063, iso: "GMB"},{place_id: 8857, iso: "GEO"},{place_id: 7207, iso: "DEU"},{place_id: 7228, iso: "GHA"},{place_id: 10292, iso: "GIB"},{place_id: 7094, iso: "GRC"},{place_id: 7704, iso: "GRL"},{place_id: 9992, iso: "GRD"},{place_id: 8177, iso: "GLP"},{place_id: 7316, iso: "GUM"},{place_id: 6940, iso: "GTM"},{place_id: 10291, iso: "GGY"},{place_id: 8512, iso: "GIN"},{place_id: 8513, iso: "GNB"},{place_id: 8142, iso: "GUY"},{place_id: 7526, iso: "HTI"},{place_id: 10293, iso: "HMD"},{place_id: 6929, iso: "HND"},{place_id: 7613, iso: "HKG"},{place_id: 7399, iso: "HUN"},{place_id: 7278, iso: "ISL"},{place_id: 6681, iso: "IND"},{place_id: 6966, iso: "IDN"},{place_id: 6818, iso: "IRN"},{place_id: 8206, iso: "IRQ"},{place_id: 6718, iso: "IRL"},{place_id: 10294, iso: "IMN"},{place_id: 6815, iso: "ISR"},{place_id: 6973, iso: "ITA"},{place_id: 8748, iso: "JAM"},{place_id: 6737, iso: "JPN"},{place_id: 10296, iso: "JEY"},{place_id: 7833, iso: "JOR"},{place_id: 7342, iso: "KAZ"},{place_id: 7042, iso: "KEN"},{place_id: 10323, iso: "KIR"},{place_id: 10298, iso: "XKO"},{place_id: 7355, iso: "KWT"},{place_id: 7346, iso: "KGZ"},{place_id: 7001, iso: "LAO"},{place_id: 8050, iso: "LVA"},{place_id: 10299, iso: "LBN"},{place_id: 8489, iso: "LSO"},{place_id: 8514, iso: "LBR"},{place_id: 7305, iso: "LBY"},{place_id: 8263, iso: "LIE"},{place_id: 8266, iso: "LTU"},{place_id: 8147, iso: "LUX"},{place_id: 10301, iso: "MAC"},{place_id: 10303, iso: "MKD"},{place_id: 7783, iso: "MDG"},{place_id: 7113, iso: "MWI"},{place_id: 7155, iso: "MYS"},{place_id: 8425, iso: "MDV"},{place_id: 7846, iso: "MLI"},{place_id: 8240, iso: "MLT"},{place_id: 10324, iso: "MHL"},{place_id: 10305, iso: "MTQ"},{place_id: 7133, iso: "MRT"},{place_id: 8357, iso: "MUS"},{place_id: 10306, iso: "MYT"},{place_id: 6793, iso: "MEX"},{place_id: 10322, iso: "FSM"},{place_id: 10302, iso: "MDA"},{place_id: 8227, iso: "MCO"},{place_id: 7347, iso: "MNG"},{place_id: 8859, iso: "MNE"},{place_id: 10304, iso: "MSR"},{place_id: 7306, iso: "MAR"},{place_id: 7134, iso: "MOZ"},{place_id: 6992, iso: "MMR"},{place_id: 7140, iso: "NAM"},{place_id: 10308, iso: "NRU"},{place_id: 7335, iso: "NPL"},{place_id: 7506, iso: "NLD"},{place_id: 7083, iso: "NCL"},{place_id: 6803, iso: "NZL"},{place_id: 6925, iso: "NIC"},{place_id: 8515, iso: "NER"},{place_id: 7141, iso: "NGA"},{place_id: 10307, iso: "NIU"},{place_id: 7333, iso: "NFK"},{place_id: 8432, iso: "PRK"},{place_id: 96773, iso: "XNC"},{place_id: 8355, iso: "MNP"},{place_id: 7016, iso: "NOR"},{place_id: 7356, iso: "OMN"},{place_id: 7076, iso: "PAK"},{place_id: 7320, iso: "PLW"},{place_id: 9753, iso: "PSE"},{place_id: 7003, iso: "PAN"},{place_id: 7013, iso: "PNG"},{place_id: 7254, iso: "PRY"},{place_id: 7513, iso: "PER"},{place_id: 6873, iso: "PHL"},{place_id: 10309, iso: "PCN"},{place_id: 7800, iso: "POL"},{place_id: 7122, iso: "PRT"},{place_id: 6848, iso: "PRI"},{place_id: 7357, iso: "QAT"},{place_id: 7046, iso: "COG"},{place_id: 8834, iso: "REU"},{place_id: 8858, iso: "ROU"},{place_id: 7161, iso: "RUS"},{place_id: 7142, iso: "RWA"},{place_id: 6685, iso: "SHN"},{place_id: 10297, iso: "KNA"},{place_id: 10300, iso: "LCA"},{place_id: 10311, iso: "SPM"},{place_id: 10317, iso: "VCT"},{place_id: 51356, iso: "BLM"},{place_id: 51360, iso: "MAF"},{place_id: 8504, iso: "WSM"},{place_id: 10310, iso: "SMR"},{place_id: 9173, iso: "STP"},{place_id: 7358, iso: "SAU"},{place_id: 6845, iso: "SEN"},{place_id: 7147, iso: "SRB"},{place_id: 8358, iso: "SYC"},{place_id: 7487, iso: "SLE"},{place_id: 6734, iso: "SGP"},{place_id: 10411, iso: "SXM"},{place_id: 8267, iso: "SVK"},{place_id: 8228, iso: "SVN"},{place_id: 7081, iso: "SLB"},{place_id: 7218, iso: "SOM"},{place_id: 6986, iso: "ZAF"},{place_id: 7985, iso: "SGS"},{place_id: 6891, iso: "KOR"},{place_id: 51754, iso: "SSD"},{place_id: 6774, iso: "ESP"},{place_id: 7077, iso: "LKA"},{place_id: 7064, iso: "SDN"},{place_id: 7827, iso: "SUR"},{place_id: 7353, iso: "SJM"},{place_id: 7143, iso: "SWZ"},{place_id: 7599, iso: "SWE"},{place_id: 7236, iso: "CHE"},{place_id: 8207, iso: "SYR"},{place_id: 7887, iso: "TWN"},{place_id: 8435, iso: "TJK"},{place_id: 7144, iso: "TZA"},{place_id: 6967, iso: "THA"},{place_id: 8516, iso: "TGO"},{place_id: 10313, iso: "TKL"},{place_id: 7841, iso: "TON"},{place_id: 7375, iso: "TTO"},{place_id: 7312, iso: "TUN"},{place_id: 7183, iso: "TUR"},{place_id: 7351, iso: "TKM"},{place_id: 7315, iso: "TCA"},{place_id: 10315, iso: "TUV"},{place_id: 6968, iso: "UGA"},{place_id: 8860, iso: "UKR"},{place_id: 7359, iso: "ARE"},{place_id: 6857, iso: "GBR"},{place_id: 1, iso: "USA"},{place_id: 10316, iso: "UMI"},{place_id: 7259, iso: "URY"},{place_id: 7352, iso: "UZB"},{place_id: 7082, iso: "VUT"},{place_id: 9213, iso: "VAT"},{place_id: 1303, iso: "VEN"},{place_id: 6847, iso: "VNM"},{place_id: 10319, iso: "VIR"},{place_id: 7334, iso: "WLF"},{place_id: 10321, iso: "ESH"},{place_id: 7837, iso: "YEM"},{place_id: 7145, iso: "ZMB"},{place_id: 7146, iso: "ZWE"}]

### generate week data
data = []
Place.where(admin_level: 0).each do |place|
  place.id = 58750 if place.id == 54505 #api not working for Antarctica
  puts place.id
  params = { verifiable: true, place_id: place.id }
  obs_count = INatAPIService.observations( params.merge( per_page: 0 ) ).total_results
  observers = INatAPIService.get("/observations/observers", params).results[0..4]
  identifiers = INatAPIService.get("/observations/identifiers", params).results[0..4]
  data << {rank: nil, place_id: place.id, place_name: place.name, obs_count: obs_count, observers: observers, identifiers: identifiers}
end

data_sorted = data.sort_by { |k| k[:obs_count] }.reverse
i=1
data_sorted.each do |a|
  a[:rank] = i
  i+=1
end

File.open("/home/inaturalist/country_stats/international_all.json","w") do |f|
  f.write(data_sorted.to_json)
end

num_weeks = data_sorted.count/7.to_f.ceil
(1..num_weeks).each do |week|
  puts week
  wstart = 7*(week-1)
  wend = 7*(week)-1
  puts data_sorted[wstart..wend].to_json
  File.open("/home/inaturalist/country_stats/international/international_#{week}.json","w") do |f|
    f.write(data_sorted[wstart..wend].to_json)
  end
end

# Make country user_map #ata, gib
data_sorted.map{|k| k[:place_id]}.each do |place_id|
  place = Place.find(place_id)
  iso = country_key.select{|a| a[:place_id]==place_id}.first[:iso].downcase
  params = { verifiable: true, place_id: place_id } #7161
  observers = INatAPIService.get("/observations/observers", params).results[0..49]
  
  taxa_sql = <<-SQL
  SELECT ST_AsText(ST_Envelope(geom)) FROM place_geometries WHERE place_id = #{place.id};
  SQL
  data = ActiveRecord::Base.connection.execute(taxa_sql)
  poly = data[0]["st_astext"]

  res = []
  observers.reverse.each do |observer|
    puts observer["user_id"]
    taxa_sql = <<-SQL
    SELECT percentile_disc(0.5) within group (order by o.latitude) AS lat, percentile_disc(0.5) within group (order by o.longitude) AS lng
    FROM observations o
    WHERE o.user_id = #{observer["user_id"]} AND quality_grade IN ('needs_id', 'research')
    AND ST_Intersects( o.geom, ST_GeomFromText('#{poly}'));
    SQL
    data = ActiveRecord::Base.connection.execute(taxa_sql)
    unless data[0]["lat"].nil?
      res << data[0].merge({user_id: observer["user_id"], observation_count: observer["observation_count"]}, login: observer["user"]["login"], icon: observer["user"]["icon"])
    end
  end

  puts res.reverse.to_json
  File.open("/home/inaturalist/country_stats/user_map/user_map_#{iso}.json","w") do |f|
    f.write(res.reverse.to_json)
  end
end

#get growth
data_sorted.map{|k| k[:place_id]}.each do |place_id|
  place = Place.find(place_id)
  iso = country_key.select{|a| a[:place_id]==place_id}.first[:iso].downcase
  params = { verifiable: true, place_id: place_id, date_field: "created", interval: "month"}
  hist = INatAPIService.get("/observations/histogram", params)
  dat = hist.to_h[:results].to_h[:month].to_h
  puts dat.map{|k,v| {month: k, month_total: v}}.to_json
  File.open("/home/inaturalist/country_stats/growth/growth_#{iso}.json","w") do |f|
    f.write(dat.map{|k,v| {month: k, month_total: v}}.to_json)
  end
end

#identifiers fig
taxa = [
 {name: "Birds", taxon_ids: [3]},
 {name: "Insects",taxon_ids: [47158]},
 {name: "Plants", taxon_ids: [211194,311249]},
 {name: "Reptiles and Amphibians", taxon_ids: [26036,20978]},
 {name: "Mammals", taxon_ids: [40151]},
 {name: "Arachnids", taxon_ids: [47119]},
 {name: "Fungi", taxon_ids: [47170]},
 {name: "Molluscs", taxon_ids: [47115]},
 {name: "Other Species", taxon_ids: [85493,47549,47534,144128,48222,47491,47686,130868,52319]},
 {name: "Fishes", taxon_ids: [47178,47273,49231,60450,49099,85497]}
]
data_sorted.map{|k| k[:place_id]}.each do |place_id|
  puts place_id
  place = Place.find(place_id)
  iso = country_key.select{|a| a[:place_id]==place_id}.first[:iso].downcase
  res = []
  taxa.each do |t|
    puts t[:name]
    params = {verifiable: true, place_id: place_id, taxon_id: t[:taxon_ids]}
    obs = INatAPIService.get("/observations", params)
    obs_count = obs[:total_results]
    identifiers = INatAPIService.get("/observations/identifiers", params)
    if identifiers[:results].count > 0
      login = identifiers[:results][0]["user"]["login"]
      icon_url = identifiers[:results][0]["user"]["icon_url"]
      res << {group: t[:name], obs_count: obs_count, login: login, icon_url: icon_url, taxon_id_string: t[:taxon_ids].join(",")+"&place_id=#{place_id}"}
    else
      res << {group: t[:name], obs_count: obs_count, login: nil, icon_url: nil, taxon_id_string: t[:taxon_ids].join(",")+"&place_id=#{place_id}"}
    end
  end
  
  data_s = res.sort_by { |k| k[:obs_count] }.reverse
  i=1
  data_s.each do |a|
    a[:rank] = i
    i+=1
  end
  
  puts data_s.to_json
  File.open("/home/inaturalist/country_stats/identifier/identifiers_#{iso}.json","w") do |f|
    f.write(data_s.to_json)
  end
end
```

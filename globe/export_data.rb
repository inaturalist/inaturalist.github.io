time_start_period = 10010.minutes.ago
end_start_period = 10000.minutes.ago

#links
ids = Identification.includes(:user, :observation).where("created_at > ? AND created_at <= ?", time_start_period, end_start_period)
user_locs = Hash.new
dats = []
ids.each do |id|
  o = id.observation
  next if o.longitude.nil?
  target = [o.longitude, o.latitude]
  u = id.user
  unless source = user_locs[u.id]
    next if u.latitude.nil?
    source = [u.longitude+rand(), u.latitude+rand()]  
    user_locs[u.id] = source
  end
  next if source[0].nil?
  row = {
          source: source,
          target: target
  }
  dats << row
end

puts dats.to_json
File.write('/home/inaturalist/loarie/links.json', dats.to_json)

#points
obs = Observation.where("latitude IS NOT NULL AND created_at > ? AND created_at <= ?", time_start_period, end_start_period)
CSV.open("/home/inaturalist/loarie/globe_obs.csv", "w") do |csv|
  csv << ["latitude", "longitude"]
  obs.each do |a|
    puts [a.latitude,a.longitude].join(",")
    csv << [a.latitude,a.longitude]
  end
end
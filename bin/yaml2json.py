import yaml
import json
import optparse
     
parser = optparse.OptionParser()
(options, args) = parser.parse_args()

if (len(args) != 1):
    raise ValueError("Must pass exactly 1 yaml file")
stream = file(args[0], 'r');
data = yaml.load(stream)
json = json.dumps(data)

print(json)

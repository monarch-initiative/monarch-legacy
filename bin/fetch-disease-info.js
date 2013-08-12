load('lib/monarch/api.js');
var Parser = require('ringo/args').Parser;
var system = require('system');


function main(args) {
    var parser = new Parser(system.args);


    parser.addOption("i","identifer","ID", "for a disease");
    parser.addOption("x");

    print(JSON.stringify(args));
    var options = parser.parse(args);

    if (options.help) {
	print(parser.help());
	system.exit('-1');
    }

    var id = options.id;
    print(JSON.stringify(options));
    print(id);

    var engine = new bbop.monarch.Engine();
    var info = engine.fetchDiseaseInfo(id); 
    print(JSON.stringify(info));
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}

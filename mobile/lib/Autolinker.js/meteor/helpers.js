if (Package.templating) {
	var Template = Package.templating.Template;
	var Blaze = Package.blaze.Blaze; // implied by `templating`
	var HTML = Package.htmljs.HTML; // implied by `blaze`

	Blaze.Template.registerHelper("autolinker", new Template('autolinker', function() {
		var view = this;
		var content = '';
		var linkerOptions = {};
		var linker;

		if (view.templateContentBlock) {
			content = Blaze._toText(view.templateContentBlock, HTML.TEXTMODE.STRING);
		}

		linker = new Autolinker(linkerOptions);
		return HTML.Raw(linker.link(content));
	}));
}

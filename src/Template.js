// Template.js




class Template {
	constructor(name, voice, settings = {}) {
		this.name = name
		this.voice = voice
		this.settings = settings || {}
	}
}


console.log(new Template)



module.exports = Template
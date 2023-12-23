// Template.js




class Template {
	constructor(config = {}) {
		this.name = config.name
		this.voice = config.voice
		this.stability = config.stability ?? 0
		this.similarity_boost = config.similarity_boost ?? config.similarityBoost ?? 0

		if (!this.name) throw new Error(`template must have a name`)
		if (!this.voice) throw new Error(`template must have a voice i.e. name of voice model`)

	}
}

module.exports = Template
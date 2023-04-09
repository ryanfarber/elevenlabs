


const axios = require("axios")
const _ = require("underscore")
const fs = require("fs")
const fsp = require("fs").promises
const Logger = require("@ryanforever/logger").v2
const logger = new Logger(__filename, {debug: true})
const voiceCache = require("../cache/voices.json")
const dateformat = require("dateformat")
const templates = require("./templates.js")




class Elevenlabs {
	constructor(config = {}) {

		const key = config.apiKey || config.key || config.token


		axios.defaults.baseURL = "https://api.elevenlabs.io/v1"
		axios.defaults.headers.common["xi-api-key"] = key


		this.syncVoices = async function() {
			logger.debug("syncing voices")
			let data = await this.getVoices()
			data = data.map(x => {
				return _.pick(x, "name", "voice_id")
			})
			await fsp.writeFile("../cache/voices.json", JSON.stringify(data, null, 2))
			logger.debug("voices saved")
		}

		/** get voices */
		this.getVoices = async function() {
			let res = await axios.get("/voices")
			let data = res?.data?.voices
			return data
		}

		/** generate speech */
		this.generate = async function(text, config = {}) {
			

			if (!text) throw new Error("please input text")
			let voice = config.voice || "pNInz6obpgDQGcFmaJgB"
			let templateName = config.template
			let num = config.num || 1
			let voice_settings = {
				stability: config.stability || 0,
				similarity_boost: config.similarity || 0
			}

			if (templateName && templates.has(templateName)) {
				let template = templates.get(templateName)
				voice = template.voice
				voice_settings = template.settings
			}



			let voiceData = voiceCache.find(x => x.name == voice || x.voice_id == voice)
			let voiceId = voiceData.voice_id
			let voiceName = voiceData.name
			let ts = dateformat(Date.now(), "yymmdd-HHMMss")
			let truncatedText = truncateString(text)
			

			logger.debug(`generating speech using "${voiceData.name}"`)
			logger.debug(`generating ${num} variation(s)`)
			console.log(`\n"${text}"\n`)

			if (!fs.existsSync("../output")) fs.mkdirSync("../output")

			for (var i = 1; i <= num; i++) {

				let filename = `${ts}_${voiceName}_${truncatedText}_${i}`
				let filepath = `../output/${filename}.mp3`

				let res = await axios.post(`/text-to-speech/${voiceId}`, {text, voice_settings}, {
					responseType: "stream",
				}).catch(err => {
					logger.log(err)
				})
				let data = res.data
				
				const writer = fs.createWriteStream(filepath)
				data.pipe(writer)

				writer.on("finish", async () => {
					logger.debug("✅ saved")
					let remain = await this.getRemainingCharacters()
					logger.debug(`you have ${remain} characters remaining`)
				})
				writer.on("error", err => {
					logger.error(err)
				})
			}

			
		}

		/** get info about user profile */
		this.getMe = async function() {
			let res = await axios.get("/user")
			let data = res.data
			return data
		}

		this.getRemainingCharacters = async function() {
			let data = await this.getMe()
			let charsUsed = data.subscription.character_count
			let charLimit = data.subscription.character_limit
			let charsLeft = charLimit - charsUsed
			return charsLeft
		}

		this.templates = templates
		function truncateString(str, maxLength) {
			str = str.replace(/\.|\?|\,/gi, "").trim()
			maxLength = maxLength || 20
			if (str.length > maxLength) {
		    // Trim the string to the maximum length
			let truncated = str.slice(0, maxLength)

		    // Re-trim if we are in the middle of a word
				truncated = truncated.slice(0, truncated.lastIndexOf(" "));
				return truncated
			} else return str
		}

	}
}




module.exports = Elevenlabs









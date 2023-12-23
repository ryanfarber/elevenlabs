


const axios = require("axios")
const _ = require("underscore")
const fs = require("fs")
const fsp = require("fs").promises
const Logger = require("@ryanforever/logger").v2

// const voiceCache = require("../cache/voices.json")
const dateformat = require("dateformat")
const templates = require("./templates.js")
const path = require("path")
const Cache = require("@ryanforever/local-database")


class Elevenlabs {
	constructor(config = {}) {

		const key = config.apiKey || config.key || config.token
		const savePath = config.savePath || "../output"
		const cache = new Cache(path.join(__dirname, "../cache/cache.json"))
		const logger = new Logger("elevenlabs", {debug: config.debug ?? false})
		const {debug, log} = logger

		axios.defaults.baseURL = "https://api.elevenlabs.io/v1"
		axios.defaults.headers.common["xi-api-key"] = key

		const voiceCacheUpdateThreshold = 1000 * 30


		this.syncVoices = async function() {
			logger.debug("syncing voices")
			let data = await this.getVoices()
			// data = data.map(x => {
			// 	return _.pick(x, "name", "voice_id")
			// })
			// let obj = {
			// 	updated: Date.now(),
			// 	voices: data
			// }
			// let dir = path.join(__dirname, "../cache/voices.json")
			// await fsp.writeFile(dir, JSON.stringify(obj, null, 2))
			
			cache.set("voices", data)
			logger.debug("voices saved")
			return data
		}

		/** get voices */
		this.getVoices = async function() {
			let res = await axios.get("/voices")
			let data = res?.data?.voices
			return data
		}

		this.getModels = async function() {
			let res = await axios.get("/models")
			let data = res.data
			return data
		}

		this.syncModels = async function() {
			let models = await this.getModels()
			cache.set("models", models)
		}

		this.sync = async function() {
			logger.debug(`syncing...`)
			this.syncModels()
			this.syncVoices()
		}

		/** generate speech */
		this.generate = async function(text, config = {}) {
			
			if (!text) throw new Error("please input text")
			let voice = config.voice || "pNInz6obpgDQGcFmaJgB"
			let templateName = config.template
			let model = config.model
			let modelId = config.modelId
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


			let voices = cache.get("voices")
			let voiceData = voices.find(x => x.name == voice || x.voice_id == voice)
			if (!voiceData) throw new Error(`could not find voice "${voice}"`)
			let voiceId = voiceData.voice_id
			let voiceName = voiceData.name
			let ts = dateformat(Date.now(), "yymmdd-HHMMss")
			let truncatedText = truncateString(text)
			

			logger.debug(`generating speech using "${voiceData.name}"`)
			logger.debug(`generating ${num} variation(s)`)
			// console.log(`\n"${text}"\n`)

			if (!fs.existsSync("../output")) fs.mkdirSync("../output")

			for (var i = 1; i <= num; i++) {

				let filename = `${ts}_${voiceName}_${truncatedText}_${i}`
				let filepath = path.join(savePath, `${filename}.mp3`)

				let res = await axios.post(`/text-to-speech/${voiceId}`, {
					text, 
					model_id: modelId,
					voice_settings
				}, {
					responseType: "stream",
				}).catch(err => {
					// logger.log(err.data)
					console.log(err.response)
					throw new Error(err)
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


		/** batch run scripts and voice combinations */
		this.batch = async function({voices = [], scripts = [], variations = 1, options = {}}) {
			log(`batch generating ${scripts.length} script(s) with ${voices.length} voice(s):\n${list(voices)}\n`)

			let collector = []
			let total = scripts.length * voices.length

			let i = 1
			for (let script of scripts) {

				for (let voice of voices) {
					debug(`batch: ${i}/${total}\nvoice: ${voice}\nscript: "${script}"`)
					let res = await this.generate(script, {
						voice,
						model: "elecven_multilingual_v1",
						...options,
						num: variations
					})
					debug(`finished batch ${i}`)
					collector.push(res)
				}
				i++
			}
			debug(`done ✅`)
			return collector
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
			str = str.replace(/\.|\?|\,|'|"|\!/gi, "").trim()
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









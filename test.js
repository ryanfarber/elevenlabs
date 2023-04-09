// test.js

require("dotenv").config()
const fs = require("fs")
const TTS = require("./src")
const tts = new TTS({
	key: process.env.KEY
})
const input = fs.readFileSync("./input.txt", "utf8")
console.log(tts)

// tts.syncVoices().then(console.log)
// tts.generate(input, {
// 	template: "oliver",
// 	num: 2
// })
// tts.getMe().then(console.log)
// tts.getRemainingCharacters().then(console.log)

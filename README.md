# elevenlabs
A simple node.js wrapper for the [ElevenLabs](https://elevenlabs.io/) speech synthesis API.

## basic usage
```javascript
const TTS = require("@ryanforever/elevenlabs")
const tts = new TTS({
    key: process.env.KEY // elevenlabs api key
})
tts.generate("hello world! today is a good day.", {
    similarity: .8,
    stability: .5,
    num: 2              // number of variations
})
```
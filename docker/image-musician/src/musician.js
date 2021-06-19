/**
 * This code is heavily inspired by https://github.com/SoftEng-HEIGVD/Teaching-Docker-UDP-sensors
 */


/*
 * Import specified protocol
 */
var protocol = require('./musician-protocol')


/*
 * We use a standard Node.js module to work with UDP
 */
const dgram = require('dgram');

/*
 * uuidv4 creates v4 UUIDs
 * https://www.npmjs.com/package/uuid
 */
const { v4: uuidv4 } = require('uuid');

/*
 * Let's create a datagram socket. We will use it to send our UDP datagrams 
 */
var server = dgram.createSocket('udp4');

/*
 * Instruments and the sound they make
 */
const instrumentMap = new Map(
    [
        ["piano", "ti-ta-ti"],
        ["trumpet", "pouet"],
        ["flute", "trulu"],
        ["violin", "gzi-gzi"],
        ["drum", "boum-boum"]
    ]
)


/**
 * Create a new musician
 * Each musician has a UUID and plays an instrument
 * Every second, a UDP datagram is sent with it's attributs
 * @param {string} instrumentRequest 
 */
function Musician(instrumentRequest) {

    if(instrumentMap.get(instrumentRequest) == undefined){
        return;
    }
    // Get musician uuid
    this.uuid = uuidv4();

    /*
     * DEBUG - Check that "activeSince" updates in Auditor.js if musician
     * is inactive for more then 5sec and emitts again before TCP called. 
     *
    this.uuid = '47669dd6-970a-4933-b327-523a1e561d34';
     * 
     */


    // This function prepares a payload and sends it in a UDP dgram.
    Musician.prototype.update = function () {

        /*
         * Create a dynamic javascript object, 
         * add the uuid and sound
         * and serialize the object to a JSON string
         */

        // Create {JSON} payload with sound emitted by instrument
        let payload = JSON.stringify({
            uuid: this.uuid,
            sound: instrumentMap.get(instrumentRequest)
        });

        /*
         * Finally, let's encapsulate the payload in a UDP datagram, which we publish on
         * the multicast address. All subscribers to this address will receive the message.
         */
        message = new Buffer.from(payload);
        server.send(message, 0, message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, function (err, bytes) {
            console.log("Sending payload : " + message + " to port " + protocol.PROTOCOL_PORT + " via port " + server.address().port);
        });
    }

    // Call update every 1 second
    setInterval(this.update.bind(this), 1000);
}


// Create new musician with parsed instrument.
new Musician(process.argv[2]);
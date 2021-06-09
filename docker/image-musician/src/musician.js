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
var s = dgram.createSocket('udp4');

/*
 * Instruments and the sound they make
 */
const instrumentMap = {
    piano : "ti-ta-ti",
    trumpet : "pouet",
    flute : "trulu",
    violin : "gzi-gzi",
    drum : "boum-boum"
}


function Musician(instrumentRequest){

    // Get musician uuid
    this.uuid = uuidv4();

    // Get current time
    var time = new Date()

    // This function prepares a payload and sends it.
    Musician.prototype.update = function(){
        
        /*
         * Create a dynamic javascript object, 
         * add the 4 properties (uuid, instrument, sound and activeSince)
         * and serialize the object to a JSON string
         */
        var data = {
            uuid : this.uuid,
            instrument : instrumentRequest,
            sound : instrumentMap[instrumentRequest],
            activeSince : time.toJSON()
        }

        payload = JSON.stringify(data);

        

       /*
	    * Finally, let's encapsulate the payload in a UDP datagram, which we publish on
	    * the multicast address. All subscribers to this address will receive the message.
	    */
        message = new Buffer.from(payload);
        s.send(message, 0, message.length, 
            protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, 
            function(err, bytes){
                console.log("Sending payload : "  + payload + " via port " + s.address().port);
            });
    }

    // Call update every 1 second
    setInterval(this.update.bind(this),1000);
}


var m = new Musician(process.argv[2]);
/*
 * 
 */
var protocol = require('./musician-protocol')


/*
 * We use a standard Node.js module to work with UDP
 */
const dgram = require('dgram');

/*
 *
 */
const { v4: uuidv4 } = require('uuid');

/*
 * Let's create a datagram socket. We will use it to send our UDP datagrams 
 */
var s = dgram.createSocket('udp4');

const instrumentMap = {
    piano : "ti-ta-ti",
    trumpet : "pouet",
    flute : "trulu",
    violin : "gzi-gzi",
    drum : "boum-boum"
}

function Musician(instrumentRequest){

    this.uuid = uuidv4();

    Musician.prototype.update = function(){
        
        var time = new Date()

        var data = {
            uuid : this.uuid,
            instrument : instrumentRequest,
            sound : instrumentMap[instrumentRequest],
            activeSince : time.toJSON()
        }

        payload = JSON.stringify(data);

        message = new Buffer(payload);

        s.send(message, 0, message.length, 
            protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, 
            function(err, bytes){
                console.log("Sending payload : "  + payload + " via port " + s.address().port);
            });
    }

    setInterval(this.update.bind(this),1000);
}


var m = new Musician(process.argv[2]);
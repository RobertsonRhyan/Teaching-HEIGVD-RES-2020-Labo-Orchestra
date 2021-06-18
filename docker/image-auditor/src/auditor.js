// Import specified protocol
const protocol = require('./auditor-protocol');

// We use a standard Node.js module to work with UDP
const dgram = require('dgram');

// We use a standard Node.js module to work with TCP
const net = require('net');

// We use a standard Node.js module to work with uuid
const { version: uuidVersion } = require('uuid');
const { validate: uuidValidate } = require('uuid');


const udpSocket = dgram.createSocket('udp4');
const tcpServer = net.createServer();

const instrumentMap = new Map(
    [
        ["ti-ta-ti", "piano"],
        ["pouet", "trumpet"],
        ["trulu", "flute"],
        ["gzi-gzi", "violin"],
        ["boum-boum", "drum"]
    ]
)

const ACTIVE_INTERVAL = 5000;

let musiciansMap = new Map();

/**
 * Checks that parsed string is a valid UUIDv4
 * @param {string} uuid 
 * @returns {boolean} validty of string
 */
function uuidValidateV4(uuid) {
    return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}


/**
 * Gets message from musician as {"uuid":"uuidv4","sound":"boum-boum"}
 * Instrument change by musician not supported (Confirmed by Assitant)
 * @param {*} msg 
 */
function getMessage(msg){

    let currentTime = Date.now();

    // Parse msg from {string} to {JSON}
    let message = JSON.parse(msg);

    // Get musician uuid from message
    let musicianKey = String(message.uuid);

    // Get instrument associated with sound from message
    // undifiened if instrument not in map
    let instrument = instrumentMap.get(message.sound);

    let validMsg = true;

    // Check if uuid is valid
    if(uuidValidateV4(toString(musicianKey))){
        console.log("Key not uuidv4 !");
        validMsg = false;
    }

    // Check that intrument was defined
    if(instrument == undefined){
        console.log("instrument doesn't exist");
        validMsg = false;
    }


    if(validMsg){
        
        let tmpMusician = musiciansMap.get(musicianKey);

        // If new or inactive
        if(tmpMusician == undefined || (currentTime - tmpMusician.lastHeard > ACTIVE_INTERVAL)){
            musiciansMap.set(musicianKey, {instrument: instrument, activeSince: currentTime, lastHeard: currentTime});
        } // Else if active
        else{
            // Update lastHeard
            musiciansMap.set(musicianKey, {instrument: instrument, activeSince: tmpMusician.activeSince, lastHeard: currentTime});
        }
        
    }else{
        console.log("Message from musician isn't valid");
    }
}

/**
 * Listen for datagram messages on port {number} PROTOCOL_PORT
 */
udpSocket.bind(protocol.PROTOCOL_PORT, () => {
    // Tells the kernel to join a multicast group at the given multicastAddress
    udpSocket.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);

    console.log("binded");
});

/**
 * The 'message' event is emitted when a new datagram is available on a socket. 
 * Calls getMessage(msg).
 * The event handler function is passed two arguments: msg and rinfo :
 *  - msg {Buffer} The message.
 *  - rinfo {Object} Remote address information.
 *      - address {string} The sender address.
 *      - family {string} The address family ('IPv4' or 'IPv6').
 *      - port {number} The sender port.
 *      - size {number} The message size.
 */
udpSocket.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

    getMessage(msg);

});

/**
 * Start listening on port {number} PROTOCOL_PORT
 */
udpSocket.on('listening', () => {
    const address = udpSocket.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });



/**
 * Start a TCP server listening for connections on port {number} PROTOCOL_PORT
 */
tcpServer.listen(protocol.PROTOCOL_PORT, () => {
    console.log("opened server on port : " + protocol.PROTOCOL_PORT);
});


/**
 * TCP server sends a {JSON} list of active musician
 * active = less then {number} ACTIVE_INTERVAL
 * returns "[]" if not active musicians (Confirmed by Assistant)
 */
tcpServer.on("connection", (socket) => {

    // Get current time
    let now = Date.now();

    // Store active musicians
    let activeMusicians = new Array();


    // Loop through each musician in musiciansMap and adding active 
    // one's (last head not more then 5sec ago) to activeMusicians array.
    musiciansMap.forEach(function(value, key){
        if(now - value.lastHeard > ACTIVE_INTERVAL){
            musiciansMap.delete(key);   // Remove inactive musicians from map (Optional)
        }else{
            activeMusicians.push({uuid: key, instrument: value.instrument, 
                activeSince: new Date(value.activeSince)});
        }
    });

    // Send {JSON} active musicians
    socket.write(JSON.stringify(activeMusicians) + '\n');
    // End connection
    socket.end();
})
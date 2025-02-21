# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**. 
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
| | ![](images/RES-Labo-Orchestra-diag.png) |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | *All Musicians, once every second.* |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | *All Auditors listen for UDP datagrams sent to multicast "239.255.22.5 (01:00:5e:7f:16:05)".* <br />- *If it's from an musician already in the list and that has been active less then **5 seconds** ago, it updates the time it was **last heard**. Else it update both **last heard** and **active since** to current time.*<br />- *If it isn't from a musician in the list, it adds the musician to the list and update both **last heard** and **active since** to current time* |
|Question | What **payload** should we put in the UDP datagrams? |
| | *The **sound** emitted by the musician's instrument and the musician's **UUID**.* |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | *We use 3 Hash Tables (Map) as dictionaries and 1 Array : <br />1. One Map in the Musician App to "map" a instrument to a sound. <br />2. One Map in the Auditor App for the opposite (sound to instrument). <br />3. Another Map in the Auditor App to store musicians ( {uuid, instrument, activeSince, lastHeard} )using their UUID as a key.<br />4. One Array in the Auditor App for the TCP server return the list of active Musicians.* |


## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | *Object to JSON string : `JSON.stringify(object)`<br />JSON string to object : `JSON.parse(jsonString)`* |
|Question | What is **npm**?  |
| | *"npm (Node Package Manager) is the package manager for Node.js"<br /> [- npmjs.com/about](https://npmjs.com/about)* |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | *`npm install <package_name>` installs a package locally. If you run `npm install`* and there is a `package.json` file in the directory, npm will install the packages in the dependencies section.<br />Before npm 5.0.0, the `--save`  flag was necessary after the package name to save it to the package.json. It's added by default now. |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | *We can use it to find packages, for example [uuid](https://www.npmjs.com/package/uuid).* |
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |

```javascript
const { v4: uuidv4 } = require('uuid');
uuidv4();
```
| | |
| ---  | --- |
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | *I used `setInterval(func, delay)`*. |
|Question | In Node.js, how can we **emit UDP datagrams**? |

```javascript
// https://github.com/SoftEng-HEIGVD/Teaching-Docker-UDP-sensors/blob/master/src/thermometer.js
var dgram = require('dgram');
var s = dgram.createSocket('udp4');

message = new Buffer(payload);
s.send(message, 0, message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, function(err, bytes) {
			console.log("Sending payload: " + payload + " via port " + s.address().port);
});
```
| | |
| ---  | --- |
|Question | In Node.js, how can we **access the command line arguments**? |
| | *`process.argv[N]`* |




## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | *We create a Dockerfile with the necessary configuration and run it with `docker build`.* |
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | *We use it to start our node app : `ENTRYPOINT [ "node", "musician.js" ]` for example.* |
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | *`$ docker run [OPTIONS] IMAGE[:TAG|@DIGEST] [COMMAND] [ARG...]`.* |
|Question | How do we get the list of all **running containers**?  |
| | *`docker ps`, and `-a`* to list all |
|Question | How do we **stop/kill** one running container?  |
| | *`docker stop [CONTAINER_NAME]` to send a `SIGTERM` then after a grace period `SIGKILL` to the main process inside the container or `docker kill [CONTAINER_NAME]` to send a `SIGKILL` directly.* |
|Question | How can we check that our running containers are effectively sending UDP datagrams?  |
| | *We can use `tcpdump` or Wirehark.* ![](images/tcpdump.png)<br />![](images/Wireshark.png) |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |

```javascript
// Step 1 : bind
/**
 * Listen for datagram messages on port {number} PROTOCOL_PORT
 */
udpSocket.bind(protocol.PROTOCOL_PORT, () => {
    // Tells the kernel to join a multicast group at the given multicastAddress
    udpSocket.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
    console.log("binded");
});

// Step 2 : listening
/**
 * Start listening on port {number} PROTOCOL_PORT
 */
udpSocket.on('listening', () => {
    const address = udpSocket.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

// Step 3 : Wait for 'message' event
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
```

| | |
| --- | --- |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | *A Map is a dictionary, it store unique key-value pairs. Using `set(key, values)` with a key that already exists in Map simply updates the values.* |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | *I didn't use Moment.js but you could use `diff()`* to get the difference in [ms] between current time and a musician's "lastHear" time. |
|Question | When and how do we **get rid of inactive players**?  |
| | *Only when a new TCP connection is created. Seems more optimized for small amounts of musician, the Map shouldn't get to big.* |
|Question | How do I implement a **simple TCP server** in Node.js?  |

```javascript
// We use a standard Node.js module to work with TCP
const net = require('net');
const tcpServer = net.createServer();
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
	// Send payload
    socket.write(payload);
    // End connection
    socket.end();
})
```


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | *We can run validate.sh. It kills/removes all containers, rebuilds images and runs a Validation app.<br /> We could also check manually by ruuning a few musician and a few auditor containers (we diffrent mapped TCP ports).* |


## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should try to run it.

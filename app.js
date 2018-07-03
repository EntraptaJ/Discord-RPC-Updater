// Kristian F Jones
// Discord RPC Updater Node.JS Server
// June 23, 2018

const DiscordRPC = require('discord-rpc');
const { register, listen } = require('push-receiver');
const fs = require('fs');
var util = require('util');
var sleep = require('sleep-promise');

const senderId = '012345';
const file = 'discordrpc.creds';
const clientID = '012345';

const scopes = ['rpc', 'rpc.api', 'messages.read'];

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

(async () => {
    // First time
    // Register to GCM and FCM
     // You should call register only once and then store the credentials somewhere
    if (fs.existsSync('./discord-rpc.json')) {
        var credentialsString = fs.readFileSync('discord-rpc.json');
        var credentials = JSON.parse(credentialsString);
        connect(credentials);
    } else {
        var credentials = await register(senderId);
        
        fs.writeFileSync('discord-rpc.json', JSON.stringify(credentials));
        connect(credentials);
    }
    await sleep(3000);

    
})();

async function connect(credentials) {

    const fcmToken = credentials.fcm.token; // Token to use to send notifications
    console.log('Use this following token to send a notification', fcmToken);
    // persistentIds is the list of notification ids received to avoid receiving all already received notifications on start.
     // get all previous persistentIds from somewhere (file, db, etc...)
    var persistentIds = [];
    try {
        var idString = fs.readFileSync('notification-data.json');
        persistentIds = JSON.parse(idString);
    } catch (e) {
    }

    await listen({ ...credentials, persistentIds }, onNotification);

};
 
// Called on new notification
function onNotification({ notification, persistentId}) {
    // Do someting with the notification
    console.log('Notification received');
    console.log(notification);
    json = JSON.parse(notification.notification.body);
    detail = json.detail;
    state = json.state;
    smallimagetext = json.smallimagetext;
    smallimageicon = json.smallimageicon;
    console.log(json.detail);
    rpc.setActivity({           // Set Discord Rich Presence 
        details: detail,  // Discord RPC Details
        state: state,  // Discord RPC State
        smallImageKey: smallimageicon,
        smallImageText: smallimagetext,
        largeImageKey: 'homeassistant_large',
        largeImageText: 'tea is delicious',
        instance: false,

    });
    var persistentIds = [];
    try {
        var idString = fs.readFileSync('notification-data.json');
        persistentIds = JSON.parse(idString);
    } catch (e) {
        
    }

    persistentIds.push(persistentId);
    fs.writeFileSync('notification-data.json', JSON.stringify(persistentIds));


}

rpc.on('ready', () => {
    console.log('Discord RPC Running');
});

rpc.login(clientID).catch(console.error);

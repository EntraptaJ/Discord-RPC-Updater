// Kristian F Jones
// Discord RPC Updater Node.JS Server
// June 23, 2018

const discordRPC = require('discord-rpc');
const { register, listen } = require('push-receiver');
const fs = require('fs');
var util = require('util');

const senderId = '012345'; // Put your own here!
const clientID = '012345'; // Put your own here!

const scopes = ['rpc', 'rpc.api', 'messages.read'];

const rpc = new discordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

var rpcState;

(async () => {
    // If credentials file exists then load otherwise generate credentials and save to file for future use.
    if (fs.existsSync('./discord-rpc.json')) {
        var credentialsString = fs.readFileSync('discord-rpc.json');
        var credentials = JSON.parse(credentialsString);
        connect(credentials);
    } else {
        var credentials = await register(senderId);
        // Save credentials to file.   
        fs.writeFileSync('discord-rpc.json', JSON.stringify(credentials));
        connect(credentials);
    }    
})();

async function connect(credentials) {
    const fcmToken = credentials.fcm.token; // Token to use to send notifications
    console.log('Use this following token to send a notification', fcmToken);
    var persistentIds = [];

    // Try to load the previous notifications from file.
    try {
        var idString = fs.readFileSync('notification-data.json');
        persistentIds = JSON.parse(idString);
    } catch (e) { // If they don't exist then log to console.
        console.log('Notification data does not exist.');
    }
    await listen({ ...credentials, persistentIds }, onNotification); // Await incomming firebase cloud messages.

};
 
// Called on new notification
function onNotification({ notification, persistentId }) {
    if (!notification.data.largeImageKey) {
        rpcLargeImageKey = 'homeassistant_large';
        rpcLargeImageText = 'HomeAssistant';
    } else {
        rpcLargeImageKey = notification.data.largeImageKey;
        rpcLargeImageText = notification.data.largeImageText;
    }
    if (!notification.data.smallImageKey) {
        rpcSmallImageKey = 'homeassistant_small';
        rpcSmallImageText = 'HomeAssistant';
    } else {
        rpcSmallImageKey = notification.data.smallImageKey;
        rpcSmallImageText = notification.data.smallImageText;
    }

    rpcState = notification.data.state; // Set the discord rich presence state variable to the Cloud messages state filed.
    rpcDetails = notification.data.details; // Set the discord rich presence details variable to the Cloud Message's details field
    rpc.setActivity({
        details: rpcDetails, // Set Discord's Rich Presence's Detials field
        state: rpcState, // Set Discord's Rich Presence's State field
        largeImageKey: rpcLargeImageKey, // Set Discord's Rich Presence's Large Image
        largeImageText: rpcLargeImageText, // Set Discord's Rich Presence's Large Image's Text 
        smallImageKey: rpcSmallImageKey, // Set Discord's Rich Presence's Small Image
        smallImageText: rpcSmallImageText, // Set Discord's Rich Presence's Small Image's Text
    }).catch(console.error); // Catch any issues
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

rpc.login(clientID).catch(console.error); // Logon to discord's Rich Presence.


function formatUnixTimestampToDatetime(unixTimestamp, offsetHours = 7) {
    const date = new Date((unixTimestamp + offsetHours * 3600) * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Helper: Cari grup berdasarkan nama
async function getGroupByName(client, name) {
    const chats = await client.getChats();
    return chats.find(chat => chat.isGroup && chat.name.toLowerCase() === name.toLowerCase());
}

module.exports = {
    formatUnixTimestampToDatetime,
    getGroupByName,
};
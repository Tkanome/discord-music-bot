require('./server');

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, InteractionType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const ytdlp = require('yt-dlp-exec');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const player = createAudioPlayer();
let queue = [];
let currentConnection = null;

client.once('ready', () => {
    console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'play') {
        const url = args[0];
        if (!url) return message.reply('Berikan link YouTube!');
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Masuk ke voice channel dulu.');

        if (!currentConnection) {
            currentConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            currentConnection.subscribe(player);
        }

        queue.push(url);
        if (queue.length === 1) {
            playNext(message);
        } else {
            message.reply('🎵 Ditambahkan ke antrian!');
        }
    }

    if (command === 'skip') {
        player.stop();
        message.reply('⏭ Lagu dilewati!');
    }

    if (command === 'stop') {
        queue = [];
        player.stop();
        if (currentConnection) {
            currentConnection.destroy();
            currentConnection = null;
        }
        message.reply('🛑 Bot keluar dan berhenti.');
    }
});

function playNext(message) {
    if (queue.length === 0) {
        if (currentConnection) {
            currentConnection.destroy();
            currentConnection = null;
        }
        return;
    }

    const url = queue[0];
    const stream = ytdlp.raw(url, {
        output: '-',
        format: 'bestaudio',
    });

    const ffmpeg = spawn(ffmpegPath, [
        '-i', 'pipe:0',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
    ]);

    stream.stdout.pipe(ffmpeg.stdin);
    const resource = createAudioResource(ffmpeg.stdout);
    player.play(resource);

    player.once(AudioPlayerStatus.Idle, () => {
        queue.shift();
        playNext(message);
    });

    message.reply(`🎶 Sekarang memutar: ${url}`);
}

client.login(process.env.MTMzODgzNTc2Mzk2OTY1ODkxMw.GYDkuC.II6laIOje7rWkGVqRBDwbRGwdff0CT2ZLUZ7sE);
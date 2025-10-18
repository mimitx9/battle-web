// Utilities for audio blob conversion to WAV (PCM16) and MP3

// Import lamejs for MP3 encoding
declare const lamejs: any;

export async function convertBlobToWav(inputBlob: Blob): Promise<Blob> {
    const arrayBuffer = await inputBlob.arrayBuffer();

    // Decode using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer: AudioBuffer = await new Promise((resolve, reject) => {
        audioContext.decodeAudioData(
            arrayBuffer.slice(0),
            (decoded) => resolve(decoded),
            (err) => reject(err)
        );
    });

    const numChannels = Math.min(2, audioBuffer.numberOfChannels || 1);
    const sampleRate = audioBuffer.sampleRate || 44100;
    const numFrames = audioBuffer.length;
    const bytesPerSample = 2; // PCM16

    // WAV header size = 44 bytes
    const wavBuffer = new ArrayBuffer(44 + numFrames * numChannels * bytesPerSample);
    const view = new DataView(wavBuffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numFrames * numChannels * bytesPerSample, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
    view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
    view.setUint16(34, 8 * bytesPerSample, true); // BitsPerSample
    writeString(view, 36, 'data');
    view.setUint32(40, numFrames * numChannels * bytesPerSample, true);

    // Write PCM samples (interleaved for 2 channels)
    let offset = 44;
    const channelData: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
        channelData.push(audioBuffer.getChannelData(ch));
    }

    for (let i = 0; i < numFrames; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
            const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, int16, true);
            offset += 2;
        }
    }

    return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

// Convert audio blob to MP3 using @breezystack/lamejs
export async function convertBlobToMp3(inputBlob: Blob, bitrate: number = 128): Promise<Blob> {
    try {
        // Dynamic import of @breezystack/lamejs
        const lamejsModule = await import('@breezystack/lamejs');
        const lamejs = lamejsModule.default || lamejsModule;
        
        const arrayBuffer = await inputBlob.arrayBuffer();
        
        // Decode using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer: AudioBuffer = await new Promise((resolve, reject) => {
            audioContext.decodeAudioData(
                arrayBuffer.slice(0),
                (decoded) => resolve(decoded),
                (err) => reject(err)
            );
        });

        const sampleRate = audioBuffer.sampleRate || 44100;
        const numChannels = Math.min(2, audioBuffer.numberOfChannels || 1);
        const numFrames = audioBuffer.length;

        // Get audio data
        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

        // Convert float32 to int16
        const leftInt16 = new Int16Array(numFrames);
        const rightInt16 = new Int16Array(numFrames);
        
        for (let i = 0; i < numFrames; i++) {
            leftInt16[i] = Math.max(-32768, Math.min(32767, leftChannel[i] * 32768));
            rightInt16[i] = Math.max(-32768, Math.min(32767, rightChannel[i] * 32768));
        }

        // Create MP3 encoder
        const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate);
        const mp3Data: Uint8Array[] = [];

        // Encode in chunks
        const chunkSize = 1152; // MP3 frame size
        for (let i = 0; i < numFrames; i += chunkSize) {
            const leftChunk = leftInt16.subarray(i, i + chunkSize);
            const rightChunk = rightInt16.subarray(i, i + chunkSize);
            
            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        // Flush remaining data
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        // Combine all MP3 data
        const totalLength = mp3Data.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of mp3Data) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return new Blob([result], { type: 'audio/mp3' });
    } catch (error) {
        console.error('Error converting to MP3:', error);
        // Fallback to WAV if MP3 conversion fails
        return convertBlobToWav(inputBlob);
    }
}



